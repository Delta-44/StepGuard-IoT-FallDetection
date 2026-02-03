import { query } from './config/database';

(async () => {
  const result = await query(`
    SELECT 
      id, 
      nombre, 
      fecha_nacimiento, 
      calcular_edad(fecha_nacimiento) as edad 
    FROM usuarios 
    ORDER BY edad DESC
  `);
  
  console.log('\n📋 Usuarios con edad calculada automáticamente:\n');
  
  result.rows.forEach(u => {
    const fecha = u.fecha_nacimiento.toISOString().split('T')[0];
    console.log(`   • ${u.nombre.padEnd(30)} | Nacimiento: ${fecha} | Edad: ${u.edad} años`);
  });
  
  console.log('');
  process.exit(0);
})();
