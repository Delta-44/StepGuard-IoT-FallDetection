import { Request, Response } from "express";
import { UsuarioModel } from "../models/usuario";
import { CuidadorModel } from "../models/cuidador";
import { DispositivoModel } from "../models/dispositivo";

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Obtener usuarios (pacientes)
    const usuarios = await UsuarioModel.findAll();
    const safeUsuarios = usuarios.map((user) => {
      const { password_hash, ...safeUser } = user;
      return { ...safeUser, role: "user" };
    });

    // Obtener cuidadores y admins
    const cuidadores = await CuidadorModel.findAll();
    const safeCuidadores = cuidadores.map((cuidador) => {
      const { password_hash, is_admin, ...safeCuidador } = cuidador;
      return {
        ...safeCuidador,
        role: is_admin ? "admin" : "caregiver",
        fullName: cuidador.nombre,
        status: "active",
      };
    });

    // Combinar ambos arrays
    const allUsers = [...safeUsuarios, ...safeCuidadores];
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestedId = Number(id);
    const authUser = (req as any).user; // From authMiddleware

    // 1. Si el usuario pide SU PROPIO perfil, usamos su rol para saber qué tabla consultar.
    // Esto resuelve el conflicto de IDs superpuestos entre pacientes y cuidadores.
    if (authUser && Number(authUser.id) === requestedId) {
       if (authUser.role === 'admin' || authUser.role === 'caregiver') {
          const cuidador = await CuidadorModel.findById(requestedId);
          if (cuidador) {
             const { password_hash, is_admin, ...safeCuidador } = cuidador;
             return res.json({
                ...safeCuidador,
                role: is_admin ? 'admin' : 'caregiver',
                fullName: cuidador.nombre,
                dispositivo: null // Admins/Cuidadores no suelen tener dispositivo_mac en este sistema
             });
          }
       } else {
          // Es un paciente
          const user = await UsuarioModel.findByIdWithDevice(requestedId);
          if (user) {
             const { password_hash, dispositivo_mac, dispositivo_nombre, dispositivo_estado, dispositivo_total_impactos, ...userData } = user;
             return res.json({
               ...userData,
               dispositivo: user.dispositivo_mac ? {
                   mac_address: dispositivo_mac,
                   nombre: dispositivo_nombre,
                   estado: dispositivo_estado,
                   total_impactos: dispositivo_total_impactos,
               } : null
             });
          }
       }
       return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Si un Admin/Cuidador busca OTRO usuario (generalmente busca Pacientes)
    // Primero buscamos en Pacientes (caso más común)
    const user = await UsuarioModel.findByIdWithDevice(requestedId);
    if (user) {
      const { password_hash, dispositivo_mac, dispositivo_nombre, dispositivo_estado, dispositivo_total_impactos, ...userData } = user;
      return res.json({
        ...userData,
        dispositivo: user.dispositivo_mac ? {
            mac_address: dispositivo_mac,
            nombre: dispositivo_nombre,
            estado: dispositivo_estado,
            total_impactos: dispositivo_total_impactos,
        } : null
      });
    }

    // 3. Si no es paciente, buscamos en Cuidadores (menos común buscar otro admin por ID exacto sin saberlo)
    const cuidador = await CuidadorModel.findById(requestedId);
    if (cuidador) {
        const { password_hash, is_admin, ...safeCuidador } = cuidador;
        return res.json({
        ...safeCuidador,
        role: is_admin ? 'admin' : 'caregiver',
        fullName: cuidador.nombre,
        dispositivo: null
        });
    }

    return res.status(404).json({ message: "Usuario no encontrado" });

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, dateOfBirth, address, phone } = req.body;

    // TODO: Implementar validación de datos si es necesario

    const updatedUser = await UsuarioModel.update(
      Number(id),
      fullName,
      email,
      dateOfBirth,
      address,
      phone,
      req.body.profilePhoto // Optional: allow updating via JSON
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export const updateUserByAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body; 

        if (role && (role !== 'admin' && role !== 'caregiver')) {
            return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'caregiver'." });
        }

        const userId = Number(id);

        // 1. Try to find user in CuidadorModel
        const cuidador = await CuidadorModel.findById(userId);

        if (cuidador) {
            // Update basic info
            const updatedCuidador = await CuidadorModel.update(
                userId, 
                name || cuidador.nombre, 
                email || cuidador.email, 
                cuidador.telefono // Keeping existing phone
            );

            // Update role if provided
            if (role) {
                const isAdmin = role === 'admin';
                await CuidadorModel.setAdmin(userId, isAdmin);
                if (updatedCuidador) updatedCuidador.is_admin = isAdmin;
            }
            
            if (updatedCuidador) {
                 return res.json({
                    message: "Caregiver updated successfully",
                    user: {
                        id: updatedCuidador.id,
                        email: updatedCuidador.email,
                        name: updatedCuidador.nombre,
                        role: updatedCuidador.is_admin ? "admin" : "caregiver",
                        is_admin: updatedCuidador.is_admin
                    }
                });
            } else {
                return res.status(500).json({ message: "Failed to update caregiver." });
            }
        }

        // 2. Try to find user in UsuarioModel (Patient)
        const usuario = await UsuarioModel.findById(userId);
        if (usuario) {
            // Update basic info
            const updatedUsuario = await UsuarioModel.update(
                userId,
                name || usuario.nombre,
                email || usuario.email,
                usuario.fecha_nacimiento,
                usuario.direccion,
                usuario.telefono
            );

            if (updatedUsuario) {
                 return res.json({
                    message: "Patient updated successfully",
                    user: {
                        id: updatedUsuario.id,
                        email: updatedUsuario.email,
                        name: updatedUsuario.nombre,
                        role: "user"
                    }
                });
            } else {
                return res.status(500).json({ message: "Failed to update patient." });
            }
        }

        return res.status(404).json({ message: "User not found." });

    } catch (error) {
        console.error("Error updating user by admin:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = (req.query.role as string) || "user"; // 'user' or 'caregiver'

    if (role === "admin") {
      // Prevent deleting admins via this generic endpoint for safety, although logic allows it
      return res.status(403).json({ message: "Cannot delete admin via this generic endpoint." });
    }

    let result = false;

    if (role === "caregiver") {
      result = await CuidadorModel.delete(Number(id));
      if (!result) return res.status(404).json({ message: "Cuidador no encontrado" });
      return res.json({ message: "Cuidador eliminado correctamente" });
    } else {
      // Default to deleting a patient (user)
      result = await UsuarioModel.delete(Number(id));
      if (!result) return res.status(404).json({ message: "Usuario no encontrado" });
      return res.json({ message: "Usuario eliminado correctamente" });
    }

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

export const assignDevice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { macAddress } = req.body;

    if (!macAddress) {
      return res.status(400).json({ message: "MAC address is required" });
    }

    // 1. Check if device exists
    const device = await DispositivoModel.findByMac(macAddress);
    if (!device) {
      return res.status(404).json({ message: "Dispositivo no encontrado" });
    }

    // 2. Check if device is already assigned
    const assignedUser = await DispositivoModel.getUsuarioAsignado(macAddress);
    if (assignedUser && assignedUser.id !== Number(id)) {
      return res.status(409).json({ 
        message: "El dispositivo ya está asignado a otro usuario",
        assignedTo: assignedUser.nombre
      });
    }

    // 3. Assign device to user
    const updatedUser = await UsuarioModel.asignarDispositivo(Number(id), macAddress);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
        message: "Dispositivo asignado correctamente",
        user: updatedUser
    });

  } catch (error) {
    console.error("Error assigning device:", error);
    res.status(500).json({ message: "Error assigning device" });
  }
};

export const exportUsersCSV = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let usersData: any[] = [];

    // 1. Fetch Data based on Role & Scope
    const scope = req.query.scope as string;
    
    // Si se pide scope='me', solo exportamos al usuario que hace la petición (sea admin, cuidador o paciente)
    if (scope === 'me') {
       if (user.role === 'admin' || user.role === 'caregiver') {
          // Buscamos en cuidadores
          const selfData = await CuidadorModel.findById(user.id);
          if (selfData) {
             // Adaptamos formato para que coincida con la estructura general
             usersData = [{
                 ...selfData,
                 dispositivo_mac: null,
                 dispositivo_nombre: null,
                 dispositivo_estado: null,
                 role: user.role
             }];
          }
       } else {
          // Buscamos en pacientes
          const selfData = await UsuarioModel.findByIdWithDevice(user.id);
          if (selfData) usersData = [selfData];
       }
    } 
    // Si NO es scope='me', mantenemos la lógica original de exportación masiva para Admins/Cuidadores
    else if (user.role === 'admin') {
      usersData = await UsuarioModel.findAllWithDevices();
    } else if (user.role === 'caregiver') {
      // Fetch assigned users
      const assignedUsers = await CuidadorModel.getUsuariosAsignados(user.id);
      
      // Fetch rich data (device info) for each assigned user
      usersData = await Promise.all(assignedUsers.map(async (u) => {
          return await UsuarioModel.findByIdWithDevice(u.id);
      }));
      // Filter out nulls
      usersData = usersData.filter(u => u !== null);

    } else {
      // Patient - fetch own data (default fallback)
      const ownData = await UsuarioModel.findByIdWithDevice(user.id);
      if (ownData) usersData = [ownData];
    }

    // 2. Generate CSV
    const headers = ['ID,Name,Email,Role,Device MAC,Device Name,Device Status'];
    const rows = usersData.map(u => {
        const role = 'user';
        const devMac = u.dispositivo_mac || '';
        const devName = u.dispositivo_nombre || '';
        const devStatus = u.dispositivo_estado ? 'Active' : (u.dispositivo_estado === false ? 'Inactive' : 'Unassigned');
        
        return `${u.id},"${u.nombre}","${u.email}",${role},${devMac},"${devName}",${devStatus}`;
    });

    const csvContent = [headers, ...rows].join('\n');

    // 3. Send Response
    res.header('Content-Type', 'text/csv');
    res.attachment('users_export.csv');
    res.send(csvContent);

  } catch (error) {
    console.error("Error exporting users CSV:", error);
    res.status(500).json({ message: "Error exporting users CSV" });
  }
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestedId = Number(id);
    const authUser = (req as any).user; 

    // console.log(`[Upload] Request received for user ${id} by ${authUser?.email}`);

    if (!req.file) {
      console.log('[Upload] No file in request');
      return res.status(400).json({ message: "No file uploaded." });
    }

    const photoUrl = req.file.path;
    // console.log(`[Upload] File uploaded to Cloudinary: ${photoUrl}`);

    let updatedUser = null;

    // Lógica para actualizar la tabla correcta según el rol del usuario logueado
    // (Asumimos que uno solo sube su propia foto o un admin sube la de otro)
    // Para simplificar, si el ID coincide con el del token, usamos el rol del token.
    if (authUser && authUser.id === requestedId) {
        if (authUser.role === 'admin' || authUser.role === 'caregiver') {
            updatedUser = await CuidadorModel.updateProfilePhoto(requestedId, photoUrl);
            // Mapeo para respuesta uniforme
            if (updatedUser) {
                updatedUser = {
                    ...updatedUser,
                    role: authUser.role
                };
            }
        } else {
            updatedUser = await UsuarioModel.updateProfilePhoto(requestedId, photoUrl);
        }
    } else {
        // Fallback: Si un admin sube la foto de otro, primero intentamos paciente, luego cuidador
        // O podríamos pasar el rol en el body/query para ser más precisos.
        // Por defecto intentamos paciente primero.
        updatedUser = await UsuarioModel.updateProfilePhoto(requestedId, photoUrl);
        if (!updatedUser) {
             updatedUser = await CuidadorModel.updateProfilePhoto(requestedId, photoUrl);
        }
    }

    if (!updatedUser) {
      console.log('[Upload] User not found during update');
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
        message: "Profile photo uploaded successfully",
        photoUrl: photoUrl,
        user: updatedUser
    });

  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({ message: "Error uploading profile photo" });
  }
};
