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
    proyectos: {
      base: '/poi/proyectos',
      nuevo: '/poi/proyectos/nuevo',
      detalles: (id: number | string) => `/poi/proyectos/${id}`,
      editar: (id: number | string) => `/poi/proyectos/${id}/editar`,
    },
    // DEPRECATED: Sistema antiguo - usar poi.proyectos en su lugar
    proyecto: {
        deprecated: true as const,
        redirectTo: '/poi/proyectos',
        detalles: '/poi/proyecto/detalles',
        documentos: '/poi/proyecto/documentos',
        actas: '/poi/proyecto/actas',
        actasNueva: '/poi/proyecto/actas/nueva',
        requerimientos: '/poi/proyecto/requerimientos',
        cronograma: '/poi/proyecto/cronograma',
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
