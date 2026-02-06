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
    const user = await UsuarioModel.findByIdWithDevice(Number(id));

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Estructurar la respuesta
    const {
      password_hash,
      dispositivo_mac,
      dispositivo_nombre,
      dispositivo_estado,
      dispositivo_total_impactos,
      ...userData
    } = user;

    const response = {
      ...userData,
      dispositivo: user.dispositivo_mac
        ? {
            mac_address: dispositivo_mac,
            nombre: dispositivo_nombre,
            estado: dispositivo_estado,
            total_impactos: dispositivo_total_impactos,
          }
        : null,
    };

    res.json(response);
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

    // 1. Fetch Data based on Role
    if (user.role === 'admin') {
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
      // Patient - fetch own data
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
