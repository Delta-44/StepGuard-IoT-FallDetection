import { Request, Response } from "express";
import { UsuarioModel } from "../models/usuario";
import { CuidadorModel } from "../models/cuidador";

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
