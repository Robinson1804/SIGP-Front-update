export const paths = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  perfil: '/perfil',
  notificaciones: '/notificaciones',
  recursosHumanos: '/recursos-humanos',
  pgd: {
    base: '/pgd',
    oei: '/pgd/oei',
    ogd: '/pgd/ogd',
    oegd: '/pgd/oegd',
    ae: '/pgd/ae',
    proyectos: '/pgd/proyectos',
  },
  poi: {
    base: '/poi',
    proyecto: {
        detalles: '/poi/proyecto/detalles',
        documentos: '/poi/proyecto/documentos',
        backlog: {
            base: '/poi/proyecto/backlog',
            tablero: '/poi/proyecto/backlog/tablero',
            dashboard: '/poi/proyecto/backlog/dashboard',
        },
    },
    actividad: {
        detalles: '/poi/actividad/detalles',
        lista: '/poi/actividad/lista',
        tablero: '/poi/actividad/tablero',
        dashboard: '/poi/actividad/dashboard',
    }
  },
};
