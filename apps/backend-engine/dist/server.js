"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const server = (0, fastify_1.default)({ logger: true });
// Enable CORS so the React app can communicate with the backend
server.register(cors_1.default, {
    origin: '*',
});
const PALETTES = {
    PORTFOLIO: [
        {
            primaryBg: '#F8FAFC',
            surfaceBg: '#FFFFFF',
            textMain: '#0F172A',
            accentColor: '#2563EB',
        },
        {
            primaryBg: '#F4F4F5',
            surfaceBg: '#FFFFFF',
            textMain: '#18181B',
            accentColor: '#059669',
        }
    ],
    DELIVERY: [
        {
            primaryBg: '#FFFBEB',
            surfaceBg: '#FFFFFF',
            textMain: '#1E293B',
            accentColor: '#EA580C',
        },
        {
            primaryBg: '#0A5C36',
            surfaceBg: '#FFFFFF',
            textMain: '#FFFFFF',
            accentColor: '#0A5C36',
        }
    ],
    ECOMMERCE: [
        {
            primaryBg: '#EEF2FF',
            surfaceBg: '#FFFFFF',
            textMain: '#1E1B4B',
            accentColor: '#4F46E5',
        },
        {
            primaryBg: '#F3F4F6',
            surfaceBg: '#E5E7EB',
            textMain: '#374151',
            accentColor: '#111827',
        }
    ],
    BANKING: [
        {
            primaryBg: '#F0F9FF',
            surfaceBg: '#FFFFFF',
            textMain: '#075985',
            accentColor: '#0369A1',
        },
        {
            primaryBg: '#FFF5F5',
            surfaceBg: '#FFE3E3',
            textMain: '#7A1C1C',
            accentColor: '#C53030',
        }
    ]
};
// Generates a random id
const genId = () => Math.random().toString(36).substring(2, 9);
// Procedural screen generation route
server.get('/api/screen/generate', async (request, reply) => {
    const query = request.query;
    const requestedLevel = parseInt(query.level || '1', 10);
    const level = Math.min(6, Math.max(1, requestedLevel));
    const versionIndex = query.versionIndex !== undefined ? parseInt(query.versionIndex, 10) : undefined;
    let appTemplate = 'PORTFOLIO';
    let layoutStructure = 'LIST';
    // Template and layout are determined per-level below (after missionText assignment)
    const components = [];
    let missionText = '';
    let themeColors = PALETTES.PORTFOLIO[0];
    // Generate structure and components based on level
    if (level === 1) {
        // ── NIVEL 1: Red Social — Tres Objetivos Procedurales ────────────────────
        appTemplate = 'Red Social';
        layoutStructure = 'LIST';
        // Map 9 variations using versionIndex:
        // - ver: (versionIndex % 3) + 1  -> 1, 2, or 3 (visual layout styles)
        // - objType: Math.floor(versionIndex / 3) % 3 -> 0, 1, or 2 (objectives)
        const ver = versionIndex !== undefined ? (versionIndex % 3) + 1 : Math.floor(Math.random() * 3) + 1;
        const objType = versionIndex !== undefined ? Math.floor(versionIndex / 3) % 3 : Math.floor(Math.random() * 3);
        if (objType === 0) {
            missionText = 'Cierra la sesión.';
        }
        else if (objType === 1) {
            missionText = 'Añade a un usuario como amigo.';
        }
        else {
            missionText = 'Deja un comentario en un post.';
        }
        if (ver === 1) {
            themeColors = { primaryBg: '#F0F2F5', surfaceBg: '#FFFFFF', textMain: '#1C1E21', accentColor: '#1877F2' };
            // Fixed top nav — 3-dots is the target component (opens menu)
            components.push({
                id: genId(),
                type: 'TOP_NAV_SOCIAL',
                label: 'Búmerbook',
                props: { isTarget: true, icon: 'ellipsis-vertical', avatar: 'bell', version: 1 }
            });
        }
        else if (ver === 2) {
            themeColors = { primaryBg: '#0B0F19', surfaceBg: '#1F2937', textMain: '#F3F4F6', accentColor: '#10B981' };
            // Fixed top nav — search icon instead of dots, not the target
            components.push({
                id: genId(),
                type: 'TOP_NAV_SOCIAL',
                label: 'Búmerbook',
                props: { isTarget: false, icon: 'search', avatar: 'bell', version: 2 }
            });
        }
        else {
            themeColors = { primaryBg: '#EBE5F9', surfaceBg: '#FAF5FF', textMain: '#2E1065', accentColor: '#D946EF' };
            // Fixed top nav — 3-bars is the target, version 3 (renders left of the icon group)
            components.push({
                id: genId(),
                type: 'TOP_NAV_SOCIAL',
                label: 'Búmerbook',
                props: { isTarget: true, icon: 'bars', avatar: 'bell', version: 3 }
            });
        }
        // 4 social posts
        const posts = [
            { user: 'María García', avatar: 'user-circle', avatarSrc: '/social/avatar_maria.png', time: 'hace 2 min',
                content: '¡Qué tarde tan maravillosa hemos pasado hoy visitando el Jardín Japonés! 🌸 Es un lugar que transmite una paz increíble, con su estanque perfectamente circular, los puentes de madera y esa preciosa pagoda al fondo. Para los que os guste la fotografía tanto como a mí, este rincón es un auténtico regalo para la vista. ¡Totalmente recomendado para dar un paseo tranquilo!',
                likes: 24, comments: 5, hasImage: true, imageSrc: '/social/post_parque.png' },
            { user: 'Carlos Ruiz', avatar: 'user', avatarSrc: '/social/avatar_carlos.png', time: 'hace 15 min',
                content: 'Recordando hoy nuestro viaje a los Alpes suizos. ¡Qué imponente el monte Cervino (Matterhorn) reflejado en el lago! 🏔️ Echo de menos esas caminatas por senderos de alta montaña y respirar el aire puro. ¿Hay algún otro aficionado al senderismo por aquí que esté planeando una ruta para este fin de semana?',
                likes: 61, comments: 12, hasImage: false },
            { user: 'Ana Martínez', avatar: 'user-circle', avatarSrc: '/social/avatar_ana.png', time: 'hace 1 hora',
                content: '¡Por fin he terminado mi nuevo cuadro abstracto! 🎨 Han sido semanas de mucho trabajo en el estudio experimentando con texturas, aplicando capas gruesas de acrílico con espátula para conseguir ese relieve y volumen tan marcado en los tonos azules y dorados. Me encanta la fuerza que transmite el remolino central. ¿Qué os parece el resultado?',
                likes: 143, comments: 38, hasImage: true, imageSrc: '/social/post_cumpleanos.png' },
            { user: 'Luis Fernández', avatar: 'user', avatarSrc: '/social/avatar_luis.png', time: 'hace 3 horas',
                content: '¡Buenas tardes a todos! Mi nieta Martina me ha cambiado hoy la foto de perfil por este dibujo de un conejito con jersey verde que ha hecho con el ordenador. Dice que me parezco a él cuando me quejo del frío en invierno... 😂 ¡La verdad es que el conejito tiene bastante más pelo que yo! Os deseo una feliz semana.',
                likes: 9, comments: 2, hasImage: false },
        ];
        posts.forEach(post => {
            components.push({ id: genId(), type: 'POST_CARD', label: post.user,
                props: {
                    avatar: post.avatar,
                    avatarSrc: post.avatarSrc,
                    time: post.time,
                    content: post.content,
                    likes: post.likes,
                    comments: post.comments,
                    hasImage: post.hasImage,
                    imageSrc: post.imageSrc,
                    isTarget: false
                }
            });
        });
        // Bottom nav tabs
        if (ver === 2) {
            // In Version 2, the bottom navigation has "Más" (icon: ellipsis) which is the target!
            [{ label: 'Inicio', icon: 'house' }, { label: 'Amigos', icon: 'user-group' },
                { label: 'Vídeos', icon: 'play' }, { label: 'Más', icon: 'ellipsis' }].forEach((item, idx) => {
                components.push({
                    id: genId(),
                    type: 'NAV_BAR_BOTTOM',
                    label: item.label,
                    props: {
                        icon: item.icon,
                        isTarget: item.label === 'Más',
                        version: 2
                    }
                });
            });
        }
        else {
            [{ label: 'Inicio', icon: 'house' }, { label: 'Amigos', icon: 'user-group' },
                { label: 'Vídeos', icon: 'play' }, { label: 'Perfil', icon: 'circle-user' }].forEach(item => {
                components.push({
                    id: genId(),
                    type: 'NAV_BAR_BOTTOM',
                    label: item.label,
                    props: {
                        icon: item.icon,
                        isTarget: false,
                        version: ver
                    }
                });
            });
        }
    }
    else if (level === 2) {
        // ── NIVEL 2: Portfolio/Landing — Pulsa el botón Continuar ────────────────
        appTemplate = 'PORTFOLIO';
        layoutStructure = 'LIST';
        const palIndex = versionIndex !== undefined ? versionIndex % PALETTES.PORTFOLIO.length : Math.floor(Math.random() * PALETTES.PORTFOLIO.length);
        themeColors = PALETTES.PORTFOLIO[palIndex];
        missionText = 'Continúa al siguiente paso.';
        components.push({ id: genId(), type: 'HEADER_MISSION', label: 'Bienvenido a Búmer', props: { hierarchy: 'high' } });
        components.push({ id: genId(), type: 'TEXT_BLOCK',
            label: 'Búmer es una plataforma diseñada para ejercitar tu mente mediante desafíos cotidianos interactivos. Para completar este nivel, lee este texto y luego busca el botón azul de "Continuar".',
            props: { hierarchy: 'medium' } });
        components.push({ id: genId(), type: 'TEXT_BLOCK',
            label: 'Consejo: Los botones de acción principal suelen estar en la parte inferior de la pantalla con colores de alto contraste.',
            props: { hierarchy: 'low' } });
        components.push({ id: genId(), type: 'BUTTON', label: 'Continuar',
            props: { intent: 'primary', hierarchy: 'high', icon: 'circle-chevron-right', isTarget: true } });
    }
    else if (level >= 3 && level <= 4) {
        // ── NIVELES 3-4: Delivery — Encuentra el producto correcto ───────────────
        appTemplate = 'DELIVERY';
        layoutStructure = 'GRID';
        const foodItems = [
            { name: 'Pizza Pepperoni', icon: 'pizza-slice', price: '12.99€', category: 'Pizzas' },
            { name: 'Hamburguesa con Queso', icon: 'hamburger', price: '8.50€', category: 'Hamburguesas' },
            { name: 'Tacos al Pastor', icon: 'pepper-hot', price: '6.00€', category: 'Occidental' },
            { name: 'Sushi de Salmón', icon: 'fish', price: '15.20€', category: 'Japonesa' },
            { name: 'Ensalada César', icon: 'leaf', price: '7.40€', category: 'Occidental' },
            { name: 'Helado de Vainilla', icon: 'ice-cream', price: '4.50€', category: 'Postres' },
            { name: 'Refresco de Cola', icon: 'glass-water', price: '2.50€', category: 'Bebidas' },
            { name: 'Agua Mineral', icon: 'bottle-water', price: '1.80€', category: 'Bebidas' },
            { name: 'Pollo Frito Coreano', icon: 'fire-burner', price: '11.90€', category: 'Coreana' },
            { name: 'Ramen de Cerdo', icon: 'bowl-food', price: '13.50€', category: 'Japonesa' },
            { name: 'Arroz Tres Delicias', icon: 'bowl-rice', price: '8.90€', category: 'Oriental' },
            { name: 'Tarta de Queso', icon: 'cookie', price: '5.50€', category: 'Postres' }
        ];
        const palIndex = versionIndex !== undefined ? versionIndex % PALETTES.DELIVERY.length : Math.floor(Math.random() * PALETTES.DELIVERY.length);
        const targetIndex = Math.floor(Math.random() * foodItems.length);
        themeColors = PALETTES.DELIVERY[palIndex];
        const targetFood = foodItems[targetIndex];
        missionText = `Agrega "${targetFood.name}" al carrito de compras.`;
        const otherFoods = foodItems.filter((_, i) => i !== targetIndex);
        const shuffledFood = [targetFood, ...otherFoods].sort(() => Math.random() - 0.5);
        components.push({
            id: genId(),
            type: 'HEADER_MISSION',
            label: 'Comida a Domicilio Rápida',
            props: { hierarchy: 'high', icon: 'utensils' }
        });
        components.push({
            id: genId(),
            type: 'TEXT_BLOCK',
            label: 'Elige tu platillo favorito de nuestra selección del día. Todos los envíos tardan menos de 30 minutos.',
            props: { hierarchy: 'low' }
        });
        // Generate product cards in GRID
        shuffledFood.forEach((food) => {
            const isTarget = food.name === targetFood.name;
            // Mix button style: icon+text, only icon, or only text
            const btnRand = Math.random();
            let label = 'Añadir';
            let icon = 'plus';
            if (btnRand < 0.33) {
                label = 'Añadir al Carrito';
                icon = 'cart-plus';
            }
            else if (btnRand < 0.66) {
                label = ''; // Only icon
                icon = food.icon;
            }
            else {
                label = 'Pedir ahora'; // Only text
                icon = '';
            }
            components.push({
                id: genId(),
                type: 'CARD_PRODUCT',
                label: food.name,
                props: {
                    hierarchy: 'medium',
                    price: food.price,
                    icon: food.icon,
                    isTarget: isTarget,
                    placeholder: label, // Store button text inside placeholder
                    category: food.category
                }
            });
        });
    }
    else {
        // ── NIVELES 5-6: Banca / E-Commerce — Camufla el botón real ─────────────
        const variation = versionIndex !== undefined ? versionIndex % 4 : Math.floor(Math.random() * 4);
        const isBanking = variation < 2;
        const palIndex = variation % 2;
        appTemplate = isBanking ? 'BANKING' : 'ECOMMERCE';
        layoutStructure = 'DENSE';
        themeColors = (PALETTES[appTemplate] || PALETTES.PORTFOLIO)[palIndex];
        // 5-6: E-Commerce or Banking (DENSE, search, bottom nav, many distractors, hidden button target)
        if (appTemplate === 'BANKING') {
            missionText = 'Realiza la transferencia segura de 150.00€.';
            components.push({
                id: genId(),
                type: 'SEARCH_BAR',
                label: 'Buscar transacciones, contactos...',
                props: { placeholder: 'Ingresa término de búsqueda' }
            });
            components.push({
                id: genId(),
                type: 'HEADER_MISSION',
                label: 'Banca Móvil - Cuenta Ahorros',
                props: { hierarchy: 'high', icon: 'wallet' }
            });
            components.push({
                id: genId(),
                type: 'TEXT_BLOCK',
                label: 'Saldo disponible: 2,450.00€ | Retiros sin tarjeta activos.',
                props: { hierarchy: 'medium' }
            });
            // Distractors - Promos & ads
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: '¡Crédito de 10,000€ YA! Pulsa Aquí',
                props: {
                    intent: 'success',
                    hierarchy: 'medium',
                    icon: 'gift',
                    isTarget: false
                }
            });
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: '¡SORTEO! Gana un smartphone hoy mismo',
                props: {
                    intent: 'danger',
                    hierarchy: 'low',
                    icon: 'trophy',
                    isTarget: false
                }
            });
            components.push({
                id: genId(),
                type: 'FORM_INPUT',
                label: 'Monto a Transferir',
                props: {
                    placeholder: '150.00€'
                }
            });
            components.push({
                id: genId(),
                type: 'FORM_INPUT',
                label: 'CBU / Alias destino',
                props: {
                    placeholder: 'juan.perez.banco'
                }
            });
            // Distractor 2
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: 'Cancelar Operación y Salir',
                props: {
                    intent: 'danger',
                    hierarchy: 'medium',
                    isTarget: false
                }
            });
            // Target Button (part of form)
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: 'Confirmar Transferencia',
                props: {
                    intent: 'primary',
                    hierarchy: 'high',
                    icon: 'shield-alt',
                    isTarget: true
                }
            });
            // Navigation Bar Bottom
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Inicio',
                props: { icon: 'home', isTarget: false }
            });
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Tarjetas',
                props: { icon: 'credit-card', isTarget: false }
            });
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Soporte',
                props: { icon: 'question-circle', isTarget: false }
            });
        }
        else {
            // ECOMMERCE
            missionText = 'Agrega la cafetera en oferta a tu carrito.';
            components.push({
                id: genId(),
                type: 'SEARCH_BAR',
                label: 'Buscar cafeteras, licuadoras...',
                props: { placeholder: 'ej. Cafetera Italiana' }
            });
            components.push({
                id: genId(),
                type: 'HEADER_MISSION',
                label: 'Super Tienda - Oferta Flash',
                props: { hierarchy: 'high', icon: 'shopping-bag' }
            });
            // Aggressive ad banner
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: '🔥 ¡DESCUENTO DE 90% EN TODO! HACE CLIC AQUÍ 🔥',
                props: {
                    intent: 'danger',
                    hierarchy: 'high',
                    icon: 'fire',
                    isTarget: false
                }
            });
            components.push({
                id: genId(),
                type: 'CARD_PRODUCT',
                label: 'Cafetera Eléctrica Express Premium',
                props: {
                    hierarchy: 'high',
                    price: '49.99€ (Antes 99.99€)',
                    icon: 'coffee',
                    isTarget: false
                }
            });
            // Another distractor
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: 'Suscribirse al boletín de ofertas',
                props: {
                    intent: 'secondary',
                    hierarchy: 'low',
                    icon: 'envelope',
                    isTarget: false
                }
            });
            // Target action
            components.push({
                id: genId(),
                type: 'BUTTON',
                label: 'Añadir al Carrito',
                props: {
                    intent: 'success',
                    hierarchy: 'high',
                    icon: 'shopping-cart',
                    isTarget: true
                }
            });
            // Bottom Nav
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Tienda',
                props: { icon: 'store', isTarget: false }
            });
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Ofertas',
                props: { icon: 'percent', isTarget: false }
            });
            components.push({
                id: genId(),
                type: 'NAV_BAR_BOTTOM',
                label: 'Mi Perfil',
                props: { icon: 'user', isTarget: false }
            });
        }
    }
    const response = {
        screenId: genId(),
        appTemplate,
        complexityLevel: requestedLevel,
        layoutStructure,
        themeColors,
        missionText,
        components
    };
    reply.send(response);
});
// Register static file serving for React frontend in production
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../../web-front/dist'),
    wildcard: false,
});
// Serve index.html for any other non-API routes (SPA routing fallback)
server.get('/*', async (request, reply) => {
    return reply.sendFile('index.html');
});
// Start the server (bind to PORT assigned by cloud provider or fallback to 3001)
const port = parseInt(process.env.PORT || '3001', 10);
server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`Procedural Backend Engine listening on ${address}`);
});
//# sourceMappingURL=server.js.map