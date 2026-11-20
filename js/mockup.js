/* ==========================================================================
   Sauna Copacabana — maqueta navegable del sistema
   Todo vive en memoria: sirve para mostrar el diseño y el funcionamiento.
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const bs = (n) => 'Bs ' + Math.round(n).toLocaleString('es-BO');
  const AHORA = 15 * 60 + 20;                       // hora simulada: 15:20
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const duracion = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icono = (id, extra = '') => `<svg class="icono icono-sm ${extra}"><use href="#${id}"/></svg>`;
  const AFORO = 60;
  const EXTRA_CADA_30 = 10;                          // Bs por cada 30 min de tiempo excedido

  // ---------- Datos de ejemplo ----------
  const ENTRADAS = [
    { id: '2h', nombre: 'Sauna 2 horas', precio: 35, minutos: 120 },
    { id: '4h', nombre: 'Sauna 4 horas', precio: 55, minutos: 240 },
    { id: 'dia', nombre: 'Día completo', precio: 80, minutos: null },
    { id: 'nino', nombre: 'Niño (2 horas)', precio: 20, minutos: 120 },
    { id: 'memb', nombre: 'Membresía', precio: 0, minutos: null },
  ];
  const entrada = (id) => ENTRADAS.find((e) => e.id === id);

  const PRODUCTOS = [
    { id: 1, cat: 'Bebidas', nombre: 'Agua 600 ml', precio: 8, stock: 46, minimo: 20, emoji: '💧' },
    { id: 2, cat: 'Bebidas', nombre: 'Refresco 500 ml', precio: 10, stock: 31, minimo: 15, emoji: '🥤' },
    { id: 3, cat: 'Bebidas', nombre: 'Bebida isotónica', precio: 15, stock: 9, minimo: 12, emoji: '🧃' },
    { id: 4, cat: 'Bebidas', nombre: 'Cerveza', precio: 20, stock: 40, minimo: 24, emoji: '🍺' },
    { id: 5, cat: 'Jugos', nombre: 'Jugo de naranja', precio: 15, stock: 25, minimo: 10, emoji: '🍊', cocina: true },
    { id: 6, cat: 'Jugos', nombre: 'Jugo de frutilla', precio: 18, stock: 18, minimo: 10, emoji: '🍓', cocina: true },
    { id: 7, cat: 'Jugos', nombre: 'Licuado de plátano', precio: 15, stock: 20, minimo: 10, emoji: '🍌', cocina: true },
    { id: 8, cat: 'Jugos', nombre: 'Api con pastel', precio: 12, stock: 0, minimo: 8, emoji: '🫖', cocina: true },
    { id: 9, cat: 'Comidas', nombre: 'Trucha a la plancha', precio: 55, stock: 14, minimo: 6, emoji: '🐟', cocina: true },
    { id: 10, cat: 'Comidas', nombre: 'Pollo a la plancha', precio: 45, stock: 16, minimo: 6, emoji: '🍗', cocina: true },
    { id: 11, cat: 'Comidas', nombre: 'Sándwich de pollo', precio: 25, stock: 12, minimo: 6, emoji: '🥪', cocina: true },
    { id: 12, cat: 'Comidas', nombre: 'Salchipapa', precio: 25, stock: 22, minimo: 8, emoji: '🍟', cocina: true },
    { id: 13, cat: 'Comidas', nombre: 'Sopa del día', precio: 20, stock: 5, minimo: 6, emoji: '🍲', cocina: true },
    { id: 14, cat: 'Snacks', nombre: 'Fruta picada', precio: 12, stock: 15, minimo: 6, emoji: '🍉' },
    { id: 15, cat: 'Snacks', nombre: 'Chocolate', precio: 8, stock: 34, minimo: 10, emoji: '🍫' },
    { id: 16, cat: 'Snacks', nombre: 'Papas en bolsa', precio: 10, stock: 28, minimo: 10, emoji: '🥔' },
    { id: 17, cat: 'Servicios', nombre: 'Toalla extra', precio: 10, stock: 60, minimo: 20, emoji: '🧺' },
    { id: 18, cat: 'Servicios', nombre: 'Bata', precio: 15, stock: 25, minimo: 10, emoji: '🥋' },
    { id: 19, cat: 'Servicios', nombre: 'Sandalias', precio: 10, stock: 30, minimo: 10, emoji: '🩴' },
    { id: 20, cat: 'Servicios', nombre: 'Masaje 30 min', precio: 80, stock: 99, minimo: 0, emoji: '💆' },
  ];
  const producto = (id) => PRODUCTOS.find((p) => p.id === id);

  // Casilleros: V-01..V-40 (varones) y D-01..D-30 (damas)
  const CASILLEROS = [];
  for (let i = 1; i <= 40; i++) CASILLEROS.push({ codigo: `V-${String(i).padStart(2, '0')}`, genero: 'V', estado: 'libre' });
  for (let i = 1; i <= 30; i++) CASILLEROS.push({ codigo: `D-${String(i).padStart(2, '0')}`, genero: 'D', estado: 'libre' });
  ['V-07', 'D-15'].forEach((c) => (CASILLEROS.find((x) => x.codigo === c).estado = 'mantenimiento'));
  const casillero = (c) => CASILLEROS.find((x) => x.codigo === c);

  // Clientes dentro (cuentas abiertas)
  const DENTRO = [
    { manilla: 'M-1018', nombre: 'Carlos Mamani', ci: '4521789', genero: 'V', casillero: 'V-03', entrada: '2h', ingreso: 12 * 60 + 40, consumos: [[1, 2], [9, 1]] },
    { manilla: 'M-1021', nombre: 'Ana Gutiérrez', ci: '6012458', genero: 'D', casillero: 'D-02', entrada: '4h', ingreso: 12 * 60 + 55, consumos: [[6, 1], [14, 1]] },
    { manilla: 'M-1024', nombre: 'Jorge Choque', ci: '3987412', genero: 'V', casillero: 'V-11', entrada: 'dia', ingreso: 10 * 60 + 15, consumos: [[4, 3], [12, 1], [1, 1]] },
    { manilla: 'M-1027', nombre: 'Patricia Vargas', ci: '5874123', genero: 'D', casillero: 'D-06', entrada: 'memb', ingreso: 13 * 60 + 30, consumos: [[20, 1]] },
    { manilla: 'M-1029', nombre: 'Miguel Torrez', ci: '7412589', genero: 'V', casillero: 'V-14', entrada: '2h', ingreso: 13 * 60 + 5, consumos: [[2, 1]] },
    { manilla: 'M-1031', nombre: 'Lucía Fernández', ci: '6325874', genero: 'D', casillero: 'D-09', entrada: '2h', ingreso: 14 * 60 + 10, consumos: [] },
    { manilla: 'M-1033', nombre: 'Rodrigo Apaza', ci: '8521473', genero: 'V', casillero: 'V-18', entrada: '4h', ingreso: 14 * 60 + 25, consumos: [[11, 1], [5, 1]] },
    { manilla: 'M-1035', nombre: 'Daniela Rojas', ci: '9632587', genero: 'D', casillero: 'D-12', entrada: '2h', ingreso: 14 * 60 + 50, consumos: [[15, 2]] },
    { manilla: 'M-1036', nombre: 'Fernando Limachi', ci: '4785213', genero: 'V', casillero: 'V-22', entrada: 'dia', ingreso: 11 * 60 + 40, consumos: [[10, 1], [4, 2], [17, 1]] },
    { manilla: 'M-1038', nombre: 'Sofía Condori', ci: '5214789', genero: 'D', casillero: 'D-17', entrada: '4h', ingreso: 15 * 60 + 0, consumos: [] },
    { manilla: 'M-1039', nombre: 'Hugo Ticona', ci: '3658741', genero: 'V', casillero: 'V-26', entrada: '2h', ingreso: 15 * 60 + 5, consumos: [[1, 1]] },
    { manilla: 'M-1040', nombre: 'Elena Quisbert', ci: '7896541', genero: 'D', casillero: 'D-21', entrada: 'nino', ingreso: 15 * 60 + 12, consumos: [[7, 1]] },
  ];
  // El resto de los 38 clientes del día se reflejan como ocupación de casilleros sin cuenta abierta en la maqueta
  DENTRO.forEach((c) => (casillero(c.casillero).estado = 'ocupado'));
  ['V-01', 'V-02', 'V-05', 'V-06', 'V-09', 'V-10', 'V-15', 'V-16', 'V-19', 'V-20', 'V-23', 'V-24', 'V-27', 'V-30', 'D-01', 'D-04', 'D-05', 'D-08', 'D-10', 'D-11', 'D-14', 'D-19', 'D-20', 'D-23', 'D-25', 'D-27']
    .forEach((c) => { casillero(c).estado = 'ocupado'; casillero(c).anonimo = true; });

  let siguienteManilla = 1042;
  let siguienteComanda = 58;
  const COMANDAS = [
    { n: 53, manilla: 'M-1024', casillero: 'V-11', items: [[12, 1]], estado: 'listo', desde: 15 * 60 + 2 },
    { n: 54, manilla: 'M-1033', casillero: 'V-18', items: [[11, 1], [5, 1]], estado: 'preparando', desde: 15 * 60 + 8 },
    { n: 55, manilla: 'M-1021', casillero: 'D-02', items: [[6, 1]], estado: 'pendiente', desde: 15 * 60 + 12 },
    { n: 56, manilla: 'M-1036', casillero: 'V-22', items: [[10, 1]], estado: 'pendiente', desde: 15 * 60 + 15 },
    { n: 57, manilla: 'M-1040', casillero: 'D-21', items: [[7, 1]], estado: 'pendiente', desde: 15 * 60 + 18 },
  ];

  const RECURSOS = ['Sauna privado 1', 'Sauna privado 2', 'Jacuzzi', 'Masajes'];
  const RESERVAS = [
    { recurso: 0, desde: 10, horas: 2, cliente: 'Familia Ortiz', estilo: 'b' },
    { recurso: 1, desde: 12, horas: 1, cliente: 'Grupo amigos (6)', estilo: '' },
    { recurso: 2, desde: 14, horas: 1, cliente: 'Pareja Salinas', estilo: 'o' },
    { recurso: 1, desde: 15, horas: 2, cliente: 'Cumpleaños Vargas', estilo: 'b' },
    { recurso: 3, desde: 16, horas: 1, cliente: 'Patricia Vargas', estilo: '' },
    { recurso: 0, desde: 17, horas: 2, cliente: 'Empresa Andina (8)', estilo: 'o' },
    { recurso: 2, desde: 18, horas: 1, cliente: 'Reserva web', estilo: '' },
    { recurso: 3, desde: 19, horas: 1, cliente: 'Lucía Fernández', estilo: 'b' },
  ];

  const CLIENTES = [
    ['Patricia Vargas', '5874123', 'Mensual ilimitada', 18, '20/11/2026', 2140],
    ['Jorge Choque', '3987412', 'Paquete 10 visitas', 9, '20/11/2026', 1185],
    ['Fernando Limachi', '4785213', '—', 7, '20/11/2026', 760],
    ['Ana Gutiérrez', '6012458', 'Mensual ilimitada', 14, '20/11/2026', 1630],
    ['Ricardo Mendoza', '2587413', 'Paquete 10 visitas', 6, '15/11/2026', 540],
    ['Gabriela Paz', '6985214', '—', 5, '12/11/2026', 410],
    ['Marco Antonio Ríos', '4123698', 'Mensual ilimitada', 11, '18/11/2026', 1290],
  ];

  // Caja del turno (ventas ya hechas antes de abrir la maqueta)
  const CAJA = { efectivo: 2140, qr: 1980, tarjeta: 740, entradas: 2310, cafeteria: 2550, apertura: 300 };

  // ---------- Cálculos ----------
  const consumoDe = (c) => c.consumos.reduce((s, [id, n]) => s + producto(id).precio * n, 0);
  const minutosDentro = (c) => AHORA - c.ingreso;
  const excedido = (c) => { const e = entrada(c.entrada); return e.minutos ? Math.max(0, minutosDentro(c) - e.minutos) : 0; };
  const cargoExtra = (c) => Math.ceil(excedido(c) / 30) * EXTRA_CADA_30;
  const clientesDentro = () => DENTRO.length + CASILLEROS.filter((x) => x.anonimo && x.estado === 'ocupado').length;
  const casillerosLibres = () => CASILLEROS.filter((x) => x.estado === 'libre').length;
  const ventasHoy = () => CAJA.entradas + CAJA.cafeteria;
  const comandasActivas = () => COMANDAS.filter((c) => c.estado !== 'entregado' && c.estado !== 'listo').length;
  const stockEstado = (p) => (p.stock === 0 ? ['Agotado', 'chip-peligro'] : p.stock < p.minimo ? ['Stock bajo', 'chip-alerta'] : ['Disponible', 'chip-ok']);

  // ---------- Avisos y modal ----------
  let temporizador;
  function avisar(texto) {
    const t = $('#tostada');
    t.textContent = texto;
    t.classList.add('visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => t.classList.remove('visible'), 2600);
  }
  function abrirModal(html) {
    $('#modal').innerHTML = html;
    $('#velo').classList.add('abierto');
    const primero = $('#modal').querySelector('input, select, button');
    if (primero) primero.focus();
  }
  function cerrarModal() { $('#velo').classList.remove('abierto'); }
  $('#velo').addEventListener('click', (e) => { if (e.target.id === 'velo' || e.target.closest('[data-cerrar]')) cerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

  // ---------- Navegación ----------
  const VISTAS = ['panel', 'recepcion', 'casilleros', 'cafeteria', 'cocina', 'reservas', 'salida', 'inventario', 'caja', 'clientes'];
  function ir(vista) {
    if (!VISTAS.includes(vista)) vista = 'panel';
    $$('.vista').forEach((v) => v.classList.toggle('activa', v.id === `v-${vista}`));
    $$('.nav-item').forEach((b) => b.classList.toggle('activo', b.dataset.vista === vista));
    $('#titulo-vista').textContent = $(`#v-${vista}`).dataset.titulo;
    $('#barra-lateral').classList.remove('abierta');
    if (location.hash !== `#${vista}`) history.replaceState(null, '', `#${vista}`);
    render[vista]();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vista], [data-ir]');
    if (b) ir(b.dataset.vista || b.dataset.ir);
  });
  window.addEventListener('hashchange', () => ir(location.hash.slice(1)));
  $('#boton-menu').addEventListener('click', () => $('#barra-lateral').classList.toggle('abierta'));

  function contadores() {
    $('#cont-dentro').textContent = DENTRO.length;
    $('#cont-cocina').textContent = comandasActivas();
  }

  // ---------- Pantallas ----------
  const render = {};

  render.panel = function () {
    const dentro = clientesDentro();
    const libres = casillerosLibres();
    $('#indicadores').innerHTML = `
      <div class="tarjeta indicador"><div class="etiqueta-ind">${icono('i-recepcion')}Clientes dentro</div><div class="valor num">${dentro} <span class="suave" style="font-size:16px">/ ${AFORO}</span></div><div class="barra-progreso"><span style="width:${Math.round((dentro / AFORO) * 100)}%"></span></div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">${icono('i-casillero')}Casilleros libres</div><div class="valor num">${libres}</div><div class="suave" style="font-size:12px">de ${CASILLEROS.length} · ${CASILLEROS.filter((c) => c.estado === 'mantenimiento').length} en mantenimiento</div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">${icono('i-caja')}Ventas de hoy</div><div class="valor num">${bs(ventasHoy())}</div><div class="tendencia">▲ 12% vs. viernes pasado</div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">${icono('i-cocina')}Pedidos en cocina</div><div class="valor num">${comandasActivas()}</div><div class="suave" style="font-size:12px">${((n) => `${n} ${n === 1 ? 'listo' : 'listos'} para entregar`)(COMANDAS.filter((c) => c.estado === 'listo').length)}</div></div>`;

    const horas = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const clientes = [4, 9, 14, 19, 24, 31, 38, 0, 0, 0, 0, 0];
    const ventas = [120, 260, 420, 610, 880, 940, 720, 0, 0, 0, 0, 0];
    $('#grafico-horas').innerHTML = horas.map((h, i) => `
      <div class="col" title="${h}:00 · ${clientes[i]} clientes · ${bs(ventas[i])}">
        <div style="display:flex;gap:3px;align-items:flex-end;height:100%;width:100%;justify-content:center">
          <div class="b l" style="height:${(clientes[i] / 40) * 100}%"></div>
          <div class="b" style="height:${(ventas[i] / 1000) * 100}%"></div>
        </div><small>${h}</small></div>`).join('');

    const alertas = [];
    DENTRO.filter((c) => excedido(c) > 0).forEach((c) => alertas.push(['chip-alerta', 'i-reloj', `${esc(c.nombre)} excedió su tiempo`, `${c.casillero} · ${duracion(excedido(c))} de más · +${bs(cargoExtra(c))}`]));
    PRODUCTOS.filter((p) => p.stock < p.minimo).forEach((p) => alertas.push([p.stock === 0 ? 'chip-peligro' : 'chip-alerta', 'i-inventario', `${esc(p.nombre)}: ${p.stock === 0 ? 'agotado' : 'stock bajo'}`, `Quedan ${p.stock} · mínimo ${p.minimo}`]));
    CASILLEROS.filter((c) => c.estado === 'mantenimiento').forEach((c) => alertas.push(['chip-neutro', 'i-casillero', `Casillero ${c.codigo} en mantenimiento`, 'Cerradura reportada']));
    $('#n-alertas').textContent = `${alertas.length} activas`;
    $('#lista-alertas').innerHTML = alertas.slice(0, 6).map(([chip, ic, t, d]) => `
      <div class="item-lista"><span class="chip ${chip}" style="padding:6px">${icono(ic)}</span><div class="detalle"><strong>${t}</strong><span>${d}</span></div></div>`).join('');

    $('#tabla-dentro-panel').innerHTML = DENTRO.slice().sort((a, b) => excedido(b) - excedido(a)).slice(0, 6).map(filaDentroCorta).join('');
    $('#lista-reservas-panel').innerHTML = RESERVAS.filter((r) => r.desde * 60 >= AHORA - 30).slice(0, 4).map((r) => `
      <div class="item-lista"><span class="chip chip-lago">${r.desde}:00</span><div class="detalle"><strong>${esc(r.cliente)}</strong><span>${RECURSOS[r.recurso]} · ${r.horas} h</span></div></div>`).join('');
  };

  function chipTiempo(c) {
    const ex = excedido(c);
    if (ex > 0) return `<span class="chip chip-alerta">${duracion(minutosDentro(c))} · +${duracion(ex)}</span>`;
    const e = entrada(c.entrada);
    if (!e.minutos) return `<span class="chip chip-neutro">${duracion(minutosDentro(c))}</span>`;
    const resta = e.minutos - minutosDentro(c);
    return `<span class="chip ${resta <= 20 ? 'chip-brasa' : 'chip-ok'}">quedan ${duracion(resta)}</span>`;
  }
  function filaDentroCorta(c) {
    return `<tr><td><span class="chip chip-neutro">${c.manilla}</span></td><td>${esc(c.nombre)}</td><td>${c.casillero}</td><td>${chipTiempo(c)}</td><td class="derecha num">${bs(consumoDe(c))}</td></tr>`;
  }

  // Recepción
  let entradaElegida = '2h';
  let casilleroElegido = null;
  function primerLibre(genero) { const c = CASILLEROS.find((x) => x.genero === genero && x.estado === 'libre'); return c ? c.codigo : null; }
  render.recepcion = function () {
    $('#aforo-recepcion').textContent = `Aforo ${clientesDentro()} / ${AFORO}`;
    $('#f-manilla').value = `M-${siguienteManilla}`;
    $('#opciones-entrada').innerHTML = ENTRADAS.map((e) => `
      <button type="button" class="opcion-entrada ${e.id === entradaElegida ? 'activo' : ''}" data-entrada="${e.id}">
        <strong>${e.nombre}</strong><span>${e.precio ? bs(e.precio) : 'Incluida en el plan'}${e.minutos ? '' : e.id === 'dia' ? ' · sin límite' : ''}</span></button>`).join('');
    const genero = $('#f-genero').value;
    if (!casilleroElegido || casillero(casilleroElegido).genero !== genero || casillero(casilleroElegido).estado !== 'libre') casilleroElegido = primerLibre(genero);
    $('#casillero-asignado').textContent = casilleroElegido ? `Casillero ${casilleroElegido}` : 'No hay casilleros libres';
    $('#total-ingreso').textContent = bs(entrada(entradaElegida).precio);
    $('#ultimos-ingresos').innerHTML = DENTRO.slice().sort((a, b) => b.ingreso - a.ingreso).slice(0, 7).map((c) => `
      <div class="item-lista"><span class="avatar">${esc(c.nombre.split(' ').map((p) => p[0]).slice(0, 2).join(''))}</span>
        <div class="detalle"><strong>${esc(c.nombre)}</strong><span>${hhmm(c.ingreso)} · ${entrada(c.entrada).nombre} · ${c.casillero}</span></div><span class="chip chip-neutro">${c.manilla}</span></div>`).join('');
  };
  $('#opciones-entrada').addEventListener('click', (e) => {
    const b = e.target.closest('[data-entrada]');
    if (!b) return;
    entradaElegida = b.dataset.entrada;
    render.recepcion();
  });
  $('#f-genero').addEventListener('change', () => { casilleroElegido = null; render.recepcion(); });
  $('#btn-otro-casillero').addEventListener('click', () => {
    const genero = $('#f-genero').value;
    const libres = CASILLEROS.filter((x) => x.genero === genero && x.estado === 'libre');
    abrirModal(`<h2 id="modal-titulo" style="font-size:20px">Elegir casillero</h2>
      <p class="suave">${libres.length} libres en ${genero === 'V' ? 'varones' : 'damas'}</p>
      <div class="mapa-casilleros">${libres.map((c) => `<button type="button" class="casillero ${c.codigo === casilleroElegido ? 'seleccionado' : ''}" data-elegir="${c.codigo}">${c.codigo}<small>Libre</small></button>`).join('')}</div>
      <div style="margin-top:14px;text-align:right"><button class="boton boton-borde" data-cerrar>Cancelar</button></div>`);
    $$('[data-elegir]').forEach((b) => b.addEventListener('click', () => { casilleroElegido = b.dataset.elegir; cerrarModal(); render.recepcion(); }));
  });
  $('#form-ingreso').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('#f-nombre').value.trim();
    const manilla = $('#f-manilla').value.trim().toUpperCase();
    if (!casilleroElegido) return avisar('No hay casilleros libres en ese vestidor.');
    if (DENTRO.some((c) => c.manilla === manilla)) return avisar(`La manilla ${manilla} ya está en uso.`);
    if (clientesDentro() >= AFORO) return avisar('Se alcanzó el aforo máximo.');
    DENTRO.push({ manilla, nombre, ci: $('#f-ci').value, genero: $('#f-genero').value, casillero: casilleroElegido, entrada: entradaElegida, ingreso: AHORA, consumos: [] });
    casillero(casilleroElegido).estado = 'ocupado';
    const precio = entrada(entradaElegida).precio;
    CAJA.entradas += precio; CAJA.efectivo += precio;
    avisar(`Ingreso registrado: ${nombre} · ${manilla} · casillero ${casilleroElegido}`);
    siguienteManilla++;
    casilleroElegido = null;
    $('#f-nombre').value = ''; $('#f-ci').value = ''; $('#f-tel').value = '';
    contadores();
    render.recepcion();
  });

  // Casilleros
  let filtroCasilleros = 'V';
  let casilleroVisto = null;
  render.casilleros = function () {
    $$('#filtros-casilleros .filtro').forEach((f) => f.classList.toggle('activo', f.dataset.filtro === filtroCasilleros));
    $('#mapa-casilleros').innerHTML = CASILLEROS.filter((c) => c.genero === filtroCasilleros).map((c) => {
      const cliente = DENTRO.find((d) => d.casillero === c.codigo);
      const clase = c.estado === 'mantenimiento' ? 'mantenimiento' : cliente && excedido(cliente) > 0 ? 'excedido' : c.estado === 'ocupado' ? 'ocupado' : '';
      const texto = c.estado === 'mantenimiento' ? 'Mantenim.' : cliente ? esc(cliente.nombre.split(' ')[0]) : c.estado === 'ocupado' ? 'Ocupado' : 'Libre';
      return `<button type="button" class="casillero ${clase} ${c.codigo === casilleroVisto ? 'seleccionado' : ''}" data-casillero="${c.codigo}" aria-label="Casillero ${c.codigo}: ${texto}">${c.codigo}<small>${texto}</small></button>`;
    }).join('');
    detalleCasillero();
  };
  function detalleCasillero() {
    const caja = $('#detalle-casillero');
    if (!casilleroVisto) { caja.innerHTML = '<p class="suave" style="margin:0">Toque un casillero para ver su detalle.</p>'; return; }
    const c = casillero(casilleroVisto);
    const cliente = DENTRO.find((d) => d.casillero === c.codigo);
    if (c.estado === 'mantenimiento') {
      caja.innerHTML = `<div class="cabecera-tarjeta"><h2>Casillero ${c.codigo}</h2><span class="chip chip-neutro">Mantenimiento</span></div><p class="suave">Cerradura reportada el 18/11 por recepción.</p><button class="boton boton-ok boton-pequeno" id="btn-habilitar">Marcar como disponible</button>`;
      $('#btn-habilitar').addEventListener('click', () => { c.estado = 'libre'; avisar(`Casillero ${c.codigo} disponible.`); render.casilleros(); });
    } else if (cliente) {
      caja.innerHTML = `<div class="cabecera-tarjeta"><h2>Casillero ${c.codigo}</h2>${chipTiempo(cliente)}</div>
        <div class="cuenta-resumen"><div class="fila"><span class="suave">Cliente</span><strong>${esc(cliente.nombre)}</strong></div><div class="fila"><span class="suave">Manilla</span><strong>${cliente.manilla}</strong></div><div class="fila"><span class="suave">Ingreso</span><strong>${hhmm(cliente.ingreso)} · ${entrada(cliente.entrada).nombre}</strong></div><div class="fila"><span class="suave">Consumo</span><strong>${bs(consumoDe(cliente))}</strong></div></div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="boton boton-primario boton-pequeno" id="btn-ver-cuenta">Ver cuenta y cobrar</button><button class="boton boton-borde boton-pequeno" id="btn-llave">Reportar llave perdida</button></div>`;
      $('#btn-ver-cuenta').addEventListener('click', () => { manillaSalida = cliente.manilla; ir('salida'); });
      $('#btn-llave').addEventListener('click', () => avisar(`Se cargará la reposición de llave a ${cliente.manilla}.`));
    } else if (c.estado === 'ocupado') {
      caja.innerHTML = `<div class="cabecera-tarjeta"><h2>Casillero ${c.codigo}</h2><span class="chip chip-lago">Ocupado</span></div><p class="suave" style="margin:0">Cliente del día (sin cuenta abierta en esta demostración).</p>`;
    } else {
      caja.innerHTML = `<div class="cabecera-tarjeta"><h2>Casillero ${c.codigo}</h2><span class="chip chip-ok">Libre</span></div><button class="boton boton-primario boton-pequeno" id="btn-asignar">Asignar en recepción</button>`;
      $('#btn-asignar').addEventListener('click', () => { $('#f-genero').value = c.genero; casilleroElegido = c.codigo; ir('recepcion'); });
    }
  }
  $('#filtros-casilleros').addEventListener('click', (e) => { const f = e.target.closest('[data-filtro]'); if (f) { filtroCasilleros = f.dataset.filtro; casilleroVisto = null; render.casilleros(); } });
  $('#mapa-casilleros').addEventListener('click', (e) => { const b = e.target.closest('[data-casillero]'); if (b) { casilleroVisto = b.dataset.casillero; render.casilleros(); } });

  // Cafetería (punto de venta)
  const CATEGORIAS = ['Todos', 'Bebidas', 'Jugos', 'Comidas', 'Snacks', 'Servicios'];
  let categoria = 'Todos';
  let pedido = [];               // [[idProducto, cantidad]]
  let metodo = 'efectivo';
  render.cafeteria = function () {
    $('#categorias').innerHTML = CATEGORIAS.map((c) => `<button type="button" class="filtro ${c === categoria ? 'activo' : ''}" data-categoria="${c}">${c}</button>`).join('');
    $('#productos').innerHTML = PRODUCTOS.filter((p) => categoria === 'Todos' || p.cat === categoria).map((p) => `
      <button type="button" class="producto" data-producto="${p.id}" ${p.stock === 0 ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}>
        <span class="emoji" aria-hidden="true">${p.emoji}</span><strong>${p.nombre}</strong>
        <span class="precio">${bs(p.precio)}</span><span class="stock">${p.stock === 0 ? 'Agotado' : p.cat === 'Servicios' ? 'Servicio' : `Stock: ${p.stock}`}</span></button>`).join('');
    const sel = $('#pos-manilla');
    const actual = sel.value;
    sel.innerHTML = `<option value="">Venta directa (sin manilla)</option>` + DENTRO.map((c) => `<option value="${c.manilla}">${c.manilla} · ${esc(c.nombre)} · ${c.casillero}</option>`).join('');
    sel.value = DENTRO.some((c) => c.manilla === actual) ? actual : DENTRO[0] ? DENTRO[0].manilla : '';
    pintarPedido();
  };
  function pintarPedido() {
    const lineas = $('#lineas-pedido');
    if (!pedido.length) lineas.innerHTML = '<p class="suave">Toque los productos para agregarlos.</p>';
    else lineas.innerHTML = pedido.map(([id, n]) => { const p = producto(id); return `
      <div class="linea"><span>${p.nombre}</span>
        <span class="cantidad"><button type="button" data-menos="${id}" aria-label="Quitar uno">−</button><span class="num">${n}</span><button type="button" data-mas="${id}" aria-label="Agregar uno">+</button></span>
        <strong class="num">${bs(p.precio * n)}</strong></div>`; }).join('');
    const total = pedido.reduce((s, [id, n]) => s + producto(id).precio * n, 0);
    $('#total-pedido').textContent = bs(total);
    const directo = !$('#pos-manilla').value;
    $('#metodos').style.display = directo ? 'grid' : 'none';
    $('#metodos').innerHTML = [['efectivo', '💵 Efectivo'], ['qr', '📱 QR'], ['tarjeta', '💳 Tarjeta'], ['mixto', '➗ Mixto']].map(([id, t]) => `<button type="button" class="metodo ${metodo === id ? 'activo' : ''}" data-metodo="${id}">${t}</button>`).join('');
    $('#btn-confirmar-pedido').textContent = directo ? `Cobrar ${bs(total)}` : `Cargar a ${$('#pos-manilla').value}`;
  }
  $('#categorias').addEventListener('click', (e) => { const b = e.target.closest('[data-categoria]'); if (b) { categoria = b.dataset.categoria; render.cafeteria(); } });
  $('#productos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-producto]');
    if (!b || b.disabled) return;
    const id = Number(b.dataset.producto);
    const l = pedido.find((x) => x[0] === id);
    if (l) l[1]++; else pedido.push([id, 1]);
    pintarPedido();
  });
  $('#lineas-pedido').addEventListener('click', (e) => {
    const mas = e.target.closest('[data-mas]'); const menos = e.target.closest('[data-menos]');
    if (mas) pedido.find((x) => x[0] === Number(mas.dataset.mas))[1]++;
    if (menos) { const l = pedido.find((x) => x[0] === Number(menos.dataset.menos)); l[1]--; if (!l[1]) pedido = pedido.filter((x) => x !== l); }
    pintarPedido();
  });
  $('#metodos').addEventListener('click', (e) => { const b = e.target.closest('[data-metodo]'); if (b) { metodo = b.dataset.metodo; pintarPedido(); } });
  $('#pos-manilla').addEventListener('change', pintarPedido);
  $('#btn-vaciar').addEventListener('click', () => { pedido = []; pintarPedido(); });
  $('#btn-confirmar-pedido').addEventListener('click', () => {
    if (!pedido.length) return avisar('El pedido está vacío.');
    const manilla = $('#pos-manilla').value;
    const total = pedido.reduce((s, [id, n]) => s + producto(id).precio * n, 0);
    pedido.forEach(([id, n]) => { const p = producto(id); if (p.cat !== 'Servicios') p.stock = Math.max(0, p.stock - n); });
    const paraCocina = pedido.filter(([id]) => producto(id).cocina);
    const cliente = DENTRO.find((c) => c.manilla === manilla);
    if (paraCocina.length) COMANDAS.push({ n: siguienteComanda++, manilla: manilla || 'Mostrador', casillero: cliente ? cliente.casillero : '—', items: paraCocina.map((x) => [...x]), estado: 'pendiente', desde: AHORA });
    if (cliente) {
      pedido.forEach(([id, n]) => cliente.consumos.push([id, n]));
      avisar(`${bs(total)} cargados a ${manilla}${paraCocina.length ? ' · pedido enviado a cocina' : ''}`);
    } else {
      CAJA.cafeteria += total; CAJA[metodo === 'mixto' ? 'efectivo' : metodo] += total;
      avisar(`Venta cobrada: ${bs(total)}${paraCocina.length ? ' · pedido enviado a cocina' : ''}`);
    }
    pedido = [];
    contadores();
    render.cafeteria();
  });

  // Cocina
  render.cocina = function () {
    ['pendiente', 'preparando', 'listo'].forEach((estado) => {
      const lista = COMANDAS.filter((c) => c.estado === estado);
      $(`#n-${estado}`).textContent = lista.length;
      $(`#k-${estado}`).innerHTML = lista.map((c) => `
        <div class="comanda">
          <div class="cab"><span>#${c.n} · ${c.casillero}</span><span class="chip ${AHORA - c.desde > 10 && estado !== 'listo' ? 'chip-peligro' : 'chip-neutro'}">${AHORA - c.desde} min</span></div>
          <ul>${c.items.map(([id, n]) => `<li>${n} × ${producto(id).nombre}</li>`).join('')}</ul>
          <div class="suave" style="font-size:12px;margin-bottom:8px">Manilla ${c.manilla}</div>
          <button class="boton ${estado === 'pendiente' ? 'boton-lago' : estado === 'preparando' ? 'boton-ok' : 'boton-borde'} boton-pequeno" style="width:100%" data-avanzar="${c.n}">
            ${estado === 'pendiente' ? 'Empezar a preparar' : estado === 'preparando' ? 'Marcar listo' : 'Entregado'}</button>
        </div>`).join('') || '<p class="suave" style="margin:0;font-size:13px">Sin pedidos.</p>';
    });
  };
  $('#v-cocina').addEventListener('click', (e) => {
    const b = e.target.closest('[data-avanzar]');
    if (!b) return;
    const c = COMANDAS.find((x) => x.n === Number(b.dataset.avanzar));
    c.estado = { pendiente: 'preparando', preparando: 'listo', listo: 'entregado' }[c.estado];
    if (c.estado === 'listo') avisar(`Pedido #${c.n} listo para el casillero ${c.casillero}`);
    contadores();
    render.cocina();
  });

  // Reservas
  const HORAS_AGENDA = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  render.reservas = function () {
    let html = `<div class="celda titulo-col">Hora</div>` + RECURSOS.map((r) => `<div class="celda titulo-col">${r}</div>`).join('');
    HORAS_AGENDA.forEach((h) => {
      html += `<div class="celda hora">${h}:00</div>`;
      RECURSOS.forEach((_, i) => {
        const r = RESERVAS.find((x) => x.recurso === i && h >= x.desde && h < x.desde + x.horas);
        if (!r) html += `<div class="celda"></div>`;
        else if (r.desde === h) html += `<div class="celda"><div class="reserva ${r.estilo}">${esc(r.cliente)}<div style="font-weight:600;opacity:.8">${r.desde}:00–${r.desde + r.horas}:00</div></div></div>`;
        else html += `<div class="celda"><div class="reserva ${r.estilo}" style="opacity:.55">continúa</div></div>`;
      });
    });
    $('#agenda').innerHTML = html;
  };
  $('#btn-nueva-reserva').addEventListener('click', () => {
    abrirModal(`<h2 id="modal-titulo" style="font-size:20px">Nueva reserva</h2>
      <form id="form-reserva" style="display:grid;gap:12px">
        <div class="campo"><label for="r-recurso">Espacio o servicio</label><select id="r-recurso">${RECURSOS.map((r, i) => `<option value="${i}">${r}</option>`).join('')}</select></div>
        <div class="formulario-rejilla"><div class="campo"><label for="r-hora">Hora</label><select id="r-hora">${HORAS_AGENDA.slice(0, -1).map((h) => `<option value="${h}">${h}:00</option>`).join('')}</select></div>
        <div class="campo"><label for="r-horas">Duración</label><select id="r-horas"><option value="1">1 hora</option><option value="2">2 horas</option></select></div></div>
        <div class="campo"><label for="r-cliente">Cliente</label><input id="r-cliente" required value="Grupo Huanca (5)"></div>
        <div class="campo"><label for="r-anticipo">Anticipo (Bs)</label><input id="r-anticipo" type="number" min="0" value="100"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="boton boton-borde" data-cerrar>Cancelar</button><button class="boton boton-primario">Guardar reserva</button></div>
      </form>`);
    $('#r-hora').value = '13';   // sugerencia: primer horario libre del sauna privado 1
    $('#form-reserva').addEventListener('submit', (e) => {
      e.preventDefault();
      const recurso = Number($('#r-recurso').value), desde = Number($('#r-hora').value), horas = Number($('#r-horas').value);
      const choca = RESERVAS.some((r) => r.recurso === recurso && desde < r.desde + r.horas && r.desde < desde + horas);
      if (choca) return avisar('Ese horario ya está ocupado: elija otra hora.');
      RESERVAS.push({ recurso, desde, horas, cliente: $('#r-cliente').value, estilo: 'o' });
      cerrarModal();
      avisar(`Reserva guardada: ${RECURSOS[recurso]} a las ${desde}:00`);
      render.reservas();
    });
  });

  // Salida y cobro
  let manillaSalida = null;
  let metodoSalida = 'efectivo';
  render.salida = function () {
    $('#n-dentro').textContent = `${DENTRO.length} cuentas abiertas`;
    $('#tabla-dentro').innerHTML = DENTRO.map((c) => `
      <tr><td><span class="chip chip-neutro">${c.manilla}</span></td><td>${esc(c.nombre)}</td><td>${c.casillero}</td><td>${hhmm(c.ingreso)}</td><td>${chipTiempo(c)}</td>
        <td class="derecha num">${bs(consumoDe(c) + cargoExtra(c))}</td><td><button class="boton boton-borde boton-pequeno" data-cobrar="${c.manilla}">Cobrar</button></td></tr>`).join('')
      || '<tr><td colspan="7" class="suave">No hay clientes dentro.</td></tr>';
    pintarCuenta();
  };
  function pintarCuenta() {
    const caja = $('#cuenta');
    const c = DENTRO.find((x) => x.manilla === manillaSalida);
    if (!c) { caja.innerHTML = '<p class="suave" style="margin:0">Elija un cliente o escanee su manilla para ver la cuenta.</p>'; return; }
    const e = entrada(c.entrada);
    const agrupado = {};
    c.consumos.forEach(([id, n]) => (agrupado[id] = (agrupado[id] || 0) + n));
    const extra = cargoExtra(c);
    const total = consumoDe(c) + extra;
    caja.innerHTML = `
      <div class="cabecera-tarjeta"><h2>Cuenta ${c.manilla}</h2>${chipTiempo(c)}</div>
      <p style="margin:0 0 12px"><strong>${esc(c.nombre)}</strong> · CI ${c.ci} · casillero ${c.casillero}</p>
      <div class="cuenta-resumen">
        <div class="fila suave"><span>${e.nombre} (pagada al ingresar, ${hhmm(c.ingreso)})</span><span class="num">${bs(e.precio)}</span></div>
        ${Object.entries(agrupado).map(([id, n]) => `<div class="fila"><span>${n} × ${producto(Number(id)).nombre}</span><span class="num">${bs(producto(Number(id)).precio * n)}</span></div>`).join('') || '<div class="fila suave"><span>Sin consumos</span><span></span></div>'}
        ${extra ? `<div class="fila" style="color:var(--alerta)"><span>Tiempo extra (${duracion(excedido(c))})</span><span class="num">${bs(extra)}</span></div>` : ''}
      </div>
      <div class="total"><span>A pagar</span><span>${bs(total)}</span></div>
      <div class="metodos">${[['efectivo', '💵 Efectivo'], ['qr', '📱 QR'], ['tarjeta', '💳 Tarjeta'], ['mixto', '➗ Mixto']].map(([id, t]) => `<button type="button" class="metodo ${metodoSalida === id ? 'activo' : ''}" data-metodo-salida="${id}">${t}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="boton boton-primario" style="flex:1" id="btn-cobrar-salida">${total ? `Cobrar ${bs(total)} y liberar ${c.casillero}` : `Registrar salida y liberar ${c.casillero}`}</button>
        <button class="boton boton-borde" id="btn-ticket">Imprimir ticket</button>
      </div>`;
    $$('[data-metodo-salida]').forEach((b) => b.addEventListener('click', () => { metodoSalida = b.dataset.metodoSalida; pintarCuenta(); }));
    $('#btn-ticket').addEventListener('click', () => avisar('Ticket enviado a la impresora de recepción.'));
    $('#btn-cobrar-salida').addEventListener('click', () => {
      CAJA.cafeteria += consumoDe(c); CAJA.entradas += extra;
      CAJA[metodoSalida === 'mixto' ? 'efectivo' : metodoSalida] += total;
      casillero(c.casillero).estado = 'libre';
      DENTRO.splice(DENTRO.indexOf(c), 1);
      avisar(`Salida registrada: ${c.nombre}. Casillero ${c.casillero} libre.`);
      manillaSalida = null;
      contadores();
      render.salida();
    });
  }
  $('#tabla-dentro').addEventListener('click', (e) => { const b = e.target.closest('[data-cobrar]'); if (b) { manillaSalida = b.dataset.cobrar; pintarCuenta(); $('#cuenta').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });

  // Inventario
  render.inventario = function () {
    $('#tabla-inventario').innerHTML = PRODUCTOS.filter((p) => p.cat !== 'Servicios' || p.id !== 20).map((p) => {
      const [t, chip] = stockEstado(p);
      return `<tr><td><span aria-hidden="true">${p.emoji}</span> ${p.nombre}</td><td>${p.cat}</td><td class="derecha num">${bs(p.precio)}</td><td class="derecha num">${p.stock}</td><td><span class="chip ${chip}">${t}</span></td></tr>`;
    }).join('');
  };

  // Caja y reportes
  render.caja = function () {
    const total = CAJA.efectivo + CAJA.qr + CAJA.tarjeta;
    const tickets = 96;   // ventas de cafetería del día (dato de ejemplo)
    $('#indicadores-caja').innerHTML = `
      <div class="tarjeta indicador"><div class="etiqueta-ind">Ventas de hoy</div><div class="valor num">${bs(total)}</div><div class="tendencia">▲ 12% vs. viernes pasado</div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">Entradas</div><div class="valor num">${bs(CAJA.entradas)}</div><div class="suave" style="font-size:12px">${clientesDentro() + 29} clientes atendidos</div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">Cafetería y servicios</div><div class="valor num">${bs(CAJA.cafeteria)}</div><div class="suave" style="font-size:12px">Ticket promedio ${bs(CAJA.cafeteria / tickets)}</div></div>
      <div class="tarjeta indicador"><div class="etiqueta-ind">Por cobrar (dentro)</div><div class="valor num">${bs(DENTRO.reduce((s, c) => s + consumoDe(c) + cargoExtra(c), 0))}</div><div class="suave" style="font-size:12px">${DENTRO.length} cuentas abiertas</div></div>`;
    const dias = ['Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const ent = [3850, 4420, 1210, 1380, 1650, 1940, CAJA.entradas];
    const caf = [3120, 3790, 980, 1150, 1420, 1680, CAJA.cafeteria];
    const max = Math.max(...ent, ...caf);
    $('#grafico-semana').innerHTML = dias.map((d, i) => `
      <div class="col" title="${d}: entradas ${bs(ent[i])} · cafetería ${bs(caf[i])}">
        <div style="display:flex;gap:3px;align-items:flex-end;height:100%;width:100%;justify-content:center">
          <div class="b l" style="height:${(ent[i] / max) * 100}%"></div><div class="b" style="height:${(caf[i] / max) * 100}%"></div>
        </div><small>${d}</small></div>`).join('');
    $('#resumen-turno').innerHTML = `
      <div class="fila"><span class="suave">Fondo inicial</span><span class="num">${bs(CAJA.apertura)}</span></div>
      <div class="fila"><span>💵 Efectivo</span><strong class="num">${bs(CAJA.efectivo)}</strong></div>
      <div class="fila"><span>📱 QR</span><strong class="num">${bs(CAJA.qr)}</strong></div>
      <div class="fila"><span>💳 Tarjeta</span><strong class="num">${bs(CAJA.tarjeta)}</strong></div>
      <div class="fila" style="border-top:1px solid var(--borde);padding-top:8px"><span>Efectivo esperado en caja</span><strong class="num">${bs(CAJA.efectivo + CAJA.apertura)}</strong></div>`;
    const top = [[9, 64], [4, 112], [6, 58], [1, 140], [10, 37], [12, 46]];
    $('#tabla-top').innerHTML = top.sort((a, b) => producto(b[0]).precio * b[1] - producto(a[0]).precio * a[1])
      .map(([id, n]) => `<tr><td>${producto(id).emoji} ${producto(id).nombre}</td><td class="derecha num">${n}</td><td class="derecha num">${bs(producto(id).precio * n)}</td></tr>`).join('');
  };
  $('#btn-cerrar-caja').addEventListener('click', () => {
    const esperado = CAJA.efectivo + CAJA.apertura;
    abrirModal(`<h2 id="modal-titulo" style="font-size:20px">Cerrar caja del turno</h2>
      <p class="suave">Cuente el efectivo y anote el monto. El sistema calcula la diferencia.</p>
      <div class="cuenta-resumen" style="margin-bottom:12px"><div class="fila"><span>Efectivo esperado</span><strong class="num">${bs(esperado)}</strong></div></div>
      <div class="campo"><label for="conteo">Efectivo contado (Bs)</label><input id="conteo" type="number" value="${esperado - 20}"></div>
      <p id="diferencia" style="margin:10px 0;font-weight:700"></p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="boton boton-borde" data-cerrar>Cancelar</button><button class="boton boton-lago" id="confirmar-cierre">Cerrar caja</button></div>`);
    const calcular = () => { const d = Number($('#conteo').value) - esperado; $('#diferencia').textContent = d === 0 ? 'Cuadra exacto ✓' : d > 0 ? `Sobrante: ${bs(d)}` : `Faltante: ${bs(-d)}`; $('#diferencia').style.color = d === 0 ? 'var(--ok)' : 'var(--alerta)'; };
    $('#conteo').addEventListener('input', calcular); calcular();
    $('#confirmar-cierre').addEventListener('click', () => { cerrarModal(); avisar('Caja cerrada. Reporte del turno enviado al administrador.'); });
  });

  // Clientes
  render.clientes = function () {
    $('#tabla-clientes').innerHTML = CLIENTES.map(([n, ci, m, v, u, g]) => `
      <tr><td><strong>${n}</strong></td><td>${ci}</td><td>${m === '—' ? '<span class="suave">—</span>' : `<span class="chip chip-brasa">${m}</span>`}</td><td class="derecha num">${v}</td><td>${u}</td><td class="derecha num">${bs(g)}</td></tr>`).join('');
  };

  // Buscador global: manilla, nombre o casillero → abre su cuenta
  $('#buscador-global').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const c = DENTRO.find((x) => x.manilla.toLowerCase() === q || x.casillero.toLowerCase() === q || x.nombre.toLowerCase().includes(q));
    if (!c) return avisar('No hay clientes dentro con ese dato.');
    manillaSalida = c.manilla;
    e.target.value = '';
    ir('salida');
  });

  // Tema claro/oscuro
  const raiz = document.documentElement;
  try { const t = localStorage.getItem('sauna.tema'); if (t) raiz.dataset.theme = t; } catch (e) { /* sin almacenamiento */ }
  $$('[data-cambiar-tema]').forEach((b) => b.addEventListener('click', () => {
    const oscuro = raiz.dataset.theme ? raiz.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    raiz.dataset.theme = oscuro ? 'light' : 'dark';
    try { localStorage.setItem('sauna.tema', raiz.dataset.theme); } catch (e) { /* sin almacenamiento */ }
  }));

  // Inicio
  contadores();
  ir(location.hash.slice(1) || 'panel');
})();
