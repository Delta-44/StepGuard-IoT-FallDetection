import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

import { CuidadorModel } from "../models/cuidador";
import { DispositivoModel } from "../models/dispositivo";

export const registerUsuario = async (req: Request, res: Response) => {
  try {
    // Log removed for privacy


    const {
      email,
      password,
      name,
      edad,
      fecha_nacimiento: fechaNacimientoParam,
      direccion,
      telefono,
      dispositivo_id,
    } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password and name are required" });
    }

    const existingUser = await UsuarioModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calcular fecha de nacimiento: priorizar fecha_nacimiento, si no hay calcular desde edad
    let fecha_nacimiento: Date | undefined = undefined;
    if (fechaNacimientoParam) {
      fecha_nacimiento = new Date(fechaNacimientoParam);
    } else if (edad && typeof edad === "number" && edad > 0) {
      const currentYear = new Date().getFullYear();
      fecha_nacimiento = new Date(currentYear - edad, 0, 1);
    }

    // 🆕 GENERAR DISPOSITIVO RANDOM AUTOMÁTICO
    let macAddressAssigned = dispositivo_id;

    if (!macAddressAssigned) {
      // Generar MAC aleatoria para demo
      const randomByte = () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, "0")
          .toUpperCase();
      const randomMac = `00:1A:2B:${randomByte()}:${randomByte()}:${randomByte()}`;

      // Crear el dispositivo en BD
      try {
        await DispositivoModel.create(
          randomMac,
          `StepGuard Device ${randomMac.slice(-8)}`,
        );
        macAddressAssigned = randomMac;
      } catch (devError) {
        console.error("Error creando dispositivo automático:", devError);
        // Si falla, seguimos sin dispositivo
      }
    }

    const newUser = await UsuarioModel.create(
      name,
      email,
      hashedPassword,
      fecha_nacimiento,
      direccion || undefined,
      telefono || undefined,
      macAddressAssigned || undefined, // Usar la MAC generada
    );



    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: "usuario" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.nombre,
        username: newUser.nombre,
        role: "usuario",
        fecha_nacimiento: newUser.fecha_nacimiento,
        telefono: newUser.telefono,
        direccion: newUser.direccion,
        dispositivo_mac: newUser.dispositivo_mac,
        status: "active",
      },
    });
  } catch (error: any) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerCuidador = async (req: Request, res: Response) => {
  try {
    // Log removed for privacy


    const { email, password, name, telefono, is_admin } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password and name are required" });
    }

    const existingCuidador = await CuidadorModel.findByEmail(email);
    if (existingCuidador) {
      return res.status(400).json({ message: "Caregiver already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCuidador = await CuidadorModel.create(
      name,
      email,
      hashedPassword,
      telefono || undefined,
      is_admin || false,
    );


    const token = jwt.sign(
      { id: newCuidador.id, email: newCuidador.email, role: "cuidador" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      message: "Caregiver registered successfully",
      token,
      user: {
        id: newCuidador.id,
        email: newCuidador.email,
        name: newCuidador.nombre,
        role: "cuidador",
      },
    });
  } catch (error: any) {
    console.error("Error registering caregiver:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
