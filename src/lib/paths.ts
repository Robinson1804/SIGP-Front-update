export const paths = {
  home: '/',
  login: '/login',
  dashboard: {
    base: '/dashboard',
    proyecto: (id: number | string) => `/dashboard/proyecto/${id}`,
    actividad: (id: number | string) => `/dashboard/actividad/${id}`,
  },
  perfil: '/perfil',
  notificaciones: '/notificaciones',
  recursosHumanos: '/recursos-humanos',
  pgd: {
    base: '/pgd',
    dashboard: '/pgd/dashboard',
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
      cronograma: (id: number | string) => `/poi/proyectos/${id}/cronograma`,
      daily: (id: number | string) => `/poi/proyectos/${id}/daily`,
      backlog: (id: number | string) => `/poi/proyectos/${id}/backlog`,
      tablero: (id: number | string) => `/poi/proyectos/${id}/tablero`,
      requerimientos: (id: number | string) => `/poi/proyectos/${id}/requerimientos`,
      documentos: (id: number | string) => `/poi/proyectos/${id}/documentos`,
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
        base: '/poi/actividad',
        detalles: '/poi/actividad/detalles',
        lista: '/poi/actividad/lista',
        tablero: '/poi/actividad/tablero',
        dashboard: '/poi/actividad/dashboard',
        byId: (id: number | string) => `/poi/actividad/${id}`,
    }
  },
  aprobaciones: {
    base: '/aprobaciones',
    pendientes: '/aprobaciones/pendientes',
  },
};
