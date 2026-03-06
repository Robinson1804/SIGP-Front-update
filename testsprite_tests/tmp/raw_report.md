
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** sigp-frontend
- **Date:** 2026-03-05
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Crear una nueva actividad KANBAN con datos válidos (PMO)
- **Test Code:** [TC001_Crear_una_nueva_actividad_KANBAN_con_datos_vlidos_PMO.py](./TC001_Crear_una_nueva_actividad_KANBAN_con_datos_vlidos_PMO.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- PMO login failed: 'Invalid credentials' message displayed after two login attempts.
- Could not log in as PMO; the user was not redirected to /dashboard.
- Logout from the previously logged-in admin account did not complete; clicking 'Cerrar sesión' did not navigate to the login page.
- Activities list page (/poi/actividad/lista) could not be accessed because PMO authentication failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/8daf4ee1-68e2-4bd2-852b-99d6362c0dd5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Guardar actividad KANBAN completando todos los campos requeridos
- **Test Code:** [TC002_Guardar_actividad_KANBAN_completando_todos_los_campos_requeridos.py](./TC002_Guardar_actividad_KANBAN_completando_todos_los_campos_requeridos.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- 'Nueva Actividad' button not found on the current page or within the project detail view.
- Project details page did not contain an 'Actividades' tab or section where a new activity could be created.
- POI/Actividades listing was intermittently replaced by a loading spinner ('Cargando sesión...'), preventing access to the activity creation UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/1360446e-5f1f-4968-b4b5-41712e6ff692
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Validación: intentar guardar actividad sin completar campos obligatorios
- **Test Code:** [TC003_Validacin_intentar_guardar_actividad_sin_completar_campos_obligatorios.py](./TC003_Validacin_intentar_guardar_actividad_sin_completar_campos_obligatorios.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Actividades list or 'Nueva Actividad' button not found on the POI/project pages; project details view is shown instead with no controls to create an activity.
- Clicking the dashboard 'Actividades' tile and attempts to open activities did not navigate to an activities list (page remained on POI/project views).
- Direct navigation attempt to /poi/actividad/lista previously showed a loading spinner and did not render the activities list, indicating the activities feature or its route is not accessible in the current session.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/3150ebf9-971f-4e6b-904a-0b7df8912bd9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Validación de fechas: fecha fin anterior a fecha inicio
- **Test Code:** [TC004_Validacin_de_fechas_fecha_fin_anterior_a_fecha_inicio.py](./TC004_Validacin_de_fechas_fecha_fin_anterior_a_fecha_inicio.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Loading spinner 'Cargando sesión...' is displayed and prevents access to the application's UI.
- 'Nueva Actividad' button and activity-creation form are not reachable from the current page (no relevant navigation elements present).
- Verification of form validation for inconsistent dates (end date before start date) could not be performed because the activity creation form could not be opened.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/083b37ed-f0ef-4fd9-899f-98bae9e9b044
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Seleccionar Acción Estratégica del PGD y coordinador responsable
- **Test Code:** [TC005_Seleccionar_Accin_Estratgica_del_PGD_y_coordinador_responsable.py](./TC005_Seleccionar_Accin_Estratgica_del_PGD_y_coordinador_responsable.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/9ecce50e-c6f1-4f41-af45-8336507a6b19
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Flujo sin PGDs activos: no hay Acciones Estratégicas disponibles y se bloquea el guardado
- **Test Code:** [TC006_Flujo_sin_PGDs_activos_no_hay_Acciones_Estratgicas_disponibles_y_se_bloquea_el_guardado.py](./TC006_Flujo_sin_PGDs_activos_no_hay_Acciones_Estratgicas_disponibles_y_se_bloquea_el_guardado.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- 'Nueva Actividad' button not found on project details page or activities list, so the activity creation form could not be opened.
- Activity creation form could not be accessed after clicking the project ('Proyecto de prueba'), preventing access to the 'Acción Estratégica' selector.
- 'Acción Estratégica' selector is not available because the activity creation UI is not reachable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/a3ea4bd3-0be6-4877-8a2b-52db266036a8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Cancelar creación de actividad desde el formulario
- **Test Code:** [TC007_Cancelar_creacin_de_actividad_desde_el_formulario.py](./TC007_Cancelar_creacin_de_actividad_desde_el_formulario.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- 'Nueva Actividad' button not found on project details page after searching the page and performing two scroll attempts.
- Activity creation form could not be opened because no control/link to start creating a new activity was found.
- Cannot verify that the user can cancel the form and return to the activities list because the form was not reachable from the current page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/ba57e640-3502-42ac-b819-71ceb39f1cdf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Crear subactividad exitosamente desde el detalle de una actividad
- **Test Code:** [TC008_Crear_subactividad_exitosamente_desde_el_detalle_de_una_actividad.py](./TC008_Crear_subactividad_exitosamente_desde_el_detalle_de_una_actividad.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Actividades tab not found in project details page 'PROY N°19: Proyecto de prueba'.
- 'Nueva Subactividad' button not found on the project details page or any reachable activity page during the session.
- Activities list page (/poi/actividad/lista) failed to load on multiple attempts (persistent loader), preventing access to the activities listing.
- No activity details page (/poi/actividad/detalles) was reached, so a subactividad could not be created or verified.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/844f6626-2c4d-4798-9627-39e65cb0a71e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Validación: Fecha Fin anterior a Fecha Inicio muestra error
- **Test Code:** [TC009_Validacin_Fecha_Fin_anterior_a_Fecha_Inicio_muestra_error.py](./TC009_Validacin_Fecha_Fin_anterior_a_Fecha_Inicio_muestra_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Nueva Subactividad button not found on activity details page; no visible or clickable control to create a subactivity was available.
- Creation form for a new subactivity could not be opened, preventing entry of Fecha Inicio and Fecha Fin.
- Validation message 'La fecha fin no puede ser anterior a la fecha inicio' could not be verified because the subactivity creation UI was inaccessible.
- The page shows an existing 'Subactividades' section but lacks any control to add a new subactivity.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/76b528a9-bb51-4342-b0a2-f6f131e6682c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Cancelación del formulario de Nueva Subactividad no crea registros
- **Test Code:** [TC010_Cancelacin_del_formulario_de_Nueva_Subactividad_no_crea_registros.py](./TC010_Cancelacin_del_formulario_de_Nueva_Subactividad_no_crea_registros.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Nueva Subactividad button not found on project details page
- Unable to open the New Subactivity form; therefore cancel behavior could not be tested
- Search and scrolling attempts (2) were performed and did not reveal any 'Nueva Subactividad' control
- No 'Subactividad' section or tab present in project details (visible tabs: Detalles, Documentos, Actas, Requerimientos, Cronograma, Backlog)

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/c2df1856-e27f-478c-9317-c6c35443d8fe
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Validación: intentar guardar con Nombre vacío muestra error
- **Test Code:** [TC011_Validacin_intentar_guardar_con_Nombre_vaco_muestra_error.py](./TC011_Validacin_intentar_guardar_con_Nombre_vaco_muestra_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Actividades section or link not found on the project details page; no 'Actividades' tab, heading, or button visible to open activities.
- No interactive element present to open an existing activity, preventing navigation to an activity details page at '/poi/actividad/detalles'.
- Unable to verify that 'Nombre' is required because the subactivity creation form could not be reached.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/2929747e-f39a-4050-85b0-ae384d7b86ab
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Validación: intentar guardar con Código vacío muestra error
- **Test Code:** [TC012_Validacin_intentar_guardar_con_Cdigo_vaco_muestra_error.py](./TC012_Validacin_intentar_guardar_con_Cdigo_vaco_muestra_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Opción 'Actividades' no encontrada en la página de detalles del proyecto ni en la lista principal de POI.
- No fue posible acceder a una actividad existente ni al formulario 'Nueva Subactividad' para probar la validación.
- Prueba de validación del campo 'Código' no se pudo ejecutar porque la ruta de navegación para crear subactividad no está disponible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/1b0828b1-60e9-42b7-a32b-393368b5f0bf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Validación: Fecha Inicio igual a Fecha Fin permite guardar
- **Test Code:** [TC013_Validacin_Fecha_Inicio_igual_a_Fecha_Fin_permite_guardar.py](./TC013_Validacin_Fecha_Inicio_igual_a_Fecha_Fin_permite_guardar.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/c1c47a5c-cd23-4c33-b76d-384652423a80
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Persistencia visual: la subactividad creada se ve al cambiar de pestaña y volver
- **Test Code:** [TC014_Persistencia_visual_la_subactividad_creada_se_ve_al_cambiar_de_pestaa_y_volver.py](./TC014_Persistencia_visual_la_subactividad_creada_se_ve_al_cambiar_de_pestaa_y_volver.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- No activity items available in the project's Backlog (page shows 'No hay historias de usuario'), therefore an activity detail page could not be opened to create a subactividad.
- The 'Nueva Subactividad' creation flow is not reachable because there is no activity detail UI accessible from the current project Backlog view.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7fae044c-986e-4bae-a199-f63364d22485/097eced2-9f0d-4182-8513-f77355c52c68
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **14.29** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---