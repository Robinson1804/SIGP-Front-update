/**
 * Actividades Feature Module
 *
 * Módulo de Actividades (Kanban) para el Sistema de Gestión de Proyectos
 *
 * Este módulo proporciona:
 * - Servicios para gestión de Actividades, Tareas Kanban y Subtareas
 * - Tipos TypeScript para todas las entidades del módulo
 * - (Futuro) Componentes UI específicos del módulo
 * - (Futuro) Hooks personalizados para el módulo
 *
 * IMPORTANTE:
 * - Las Actividades usan metodología KANBAN (flujo continuo, sin sprints)
 * - Las Tareas Kanban pertenecen a Actividades
 * - Las Subtareas SOLO existen para tareas Kanban (NO para tareas Scrum)
 */

// ============================================
// Services - API integration
// ============================================
export * from './services';

// ============================================
// Types - TypeScript definitions
// ============================================
export * from './types';

// ============================================
// Components - UI components
// ============================================
export * from './components';

// ============================================
// Hooks - Custom hooks
// ============================================
export * from './hooks';
