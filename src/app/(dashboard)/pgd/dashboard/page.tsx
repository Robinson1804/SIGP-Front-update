"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// Import from planning module
import {
  getPGDs,
  getPGDDashboard,
  getPGDStats,
  downloadPGDExport,
  type PGD,
  type PGDDashboard,
  type PGDStats,
  type AvanceOEI,
  type AvanceOGD,
} from "@/features/planning";

// Estado colors
const ESTADO_COLORS: Record<string, string> = {
  'Pendiente': '#FFA500',
  'En planificacion': '#3B82F6',
  'En desarrollo': '#8B5CF6',
  'Finalizado': '#22C55E',
  'Cancelado': '#EF4444',
};

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "#018CD1",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" style={{ color }} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Avance por OEI Chart
function AvanceOEIChart({ data }: { data: AvanceOEI[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de OEI disponibles
      </div>
    );
  }

  const chartData = data.map((oei) => ({
    name: oei.codigo,
    planificado: oei.avancePlanificado,
    real: oei.avanceReal,
    diferencia: oei.diferencia,
    fullName: oei.nombre,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === "planificado" ? "Planificado" : "Real"]}
          labelFormatter={(label: string, payload: any[]) => {
            const item = payload?.[0]?.payload;
            return item?.fullName || label;
          }}
        />
        <Legend />
        <Bar dataKey="planificado" name="Planificado" fill="#94A3B8" radius={[0, 4, 4, 0]} />
        <Bar dataKey="real" name="Real" fill="#018CD1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Avance por OGD Chart
function AvanceOGDChart({ data }: { data: AvanceOGD[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de OGD disponibles
      </div>
    );
  }

  const chartData = data.map((ogd) => ({
    name: ogd.codigo,
    planificado: ogd.avancePlanificado,
    real: ogd.avanceReal,
    diferencia: ogd.diferencia,
    fullName: ogd.nombre,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === "planificado" ? "Planificado" : "Real"]}
          labelFormatter={(label: string, payload: any[]) => {
            const item = payload?.[0]?.payload;
            return item?.fullName || label;
          }}
        />
        <Legend />
        <Bar dataKey="planificado" name="Planificado" fill="#94A3B8" radius={[0, 4, 4, 0]} />
        <Bar dataKey="real" name="Real" fill="#22C55E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Distribución por Estado Chart
function EstadoDistributionChart({
  data,
  title,
}: {
  data: { estado: string; cantidad: number; porcentaje: number }[];
  title: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.estado,
    value: item.cantidad,
    percentage: item.porcentaje,
    fill: ESTADO_COLORS[item.estado] || "#6B7280",
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percentage }) => `${name}: ${percentage?.toFixed(0) || 0}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, "Cantidad"]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Main Dashboard Component
export default function PGDDashboardPage() {
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [dashboard, setDashboard] = useState<PGDDashboard | null>(null);
  const [stats, setStats] = useState<PGDStats | null>(null);

  const [isLoadingPgds, setIsLoadingPgds] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Load PGDs
  const loadPGDs = useCallback(async () => {
    setIsLoadingPgds(true);
    setError(null);
    try {
      const data = await getPGDs();
      setPgds(data);
      if (data.length > 0 && !selectedPgdId) {
        // Select the active PGD or the first one
        const activePgd = data.find((p) => p.estado === "VIGENTE") || data[0];
        setSelectedPgdId(activePgd.id.toString());
      }
    } catch (err: any) {
      console.error("Error loading PGDs:", err);
      setError("Error al cargar los planes de gobierno digital");
      toast({
        title: "Error",
        description: "No se pudieron cargar los PGDs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPgds(false);
    }
  }, [selectedPgdId, toast]);

  // Load Dashboard data
  const loadDashboard = useCallback(async () => {
    if (!selectedPgdId) {
      setDashboard(null);
      setStats(null);
      return;
    }

    setIsLoadingDashboard(true);
    try {
      // Try to load dashboard first, fallback to stats
      try {
        const dashboardData = await getPGDDashboard(selectedPgdId);
        setDashboard(dashboardData);
        setStats(dashboardData.stats);
      } catch {
        // If dashboard endpoint doesn't exist, load stats only
        const statsData = await getPGDStats(selectedPgdId);
        setStats(statsData);
        // Create basic dashboard from stats
        setDashboard({
          pgdId: Number(selectedPgdId),
          nombre: pgds.find((p) => p.id.toString() === selectedPgdId)?.nombre || "",
          anioInicio: pgds.find((p) => p.id.toString() === selectedPgdId)?.anioInicio || 0,
          anioFin: pgds.find((p) => p.id.toString() === selectedPgdId)?.anioFin || 0,
          estado: pgds.find((p) => p.id.toString() === selectedPgdId)?.estado || "BORRADOR",
          stats: statsData,
          progresoGeneral: 0,
          avanceOEIs: [],
          avanceOGDs: [],
          proyectosPorEstado: [],
          actividadesPorEstado: [],
        });
      }
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      toast({
        title: "Error",
        description: "No se pudo cargar el dashboard del PGD",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [selectedPgdId, pgds, toast]);

  // Handle export
  const handleExport = async (format: "pdf" | "excel") => {
    if (!selectedPgdId) return;

    setIsExporting(true);
    try {
      await downloadPGDExport(selectedPgdId, format);
      toast({
        title: "Exportado",
        description: `El PGD ha sido exportado a ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        title: "Error",
        description: `No se pudo exportar a ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPGDs();
  }, []);

  // Load dashboard when PGD changes
  useEffect(() => {
    if (selectedPgdId) {
      loadDashboard();
    }
  }, [selectedPgdId, loadDashboard]);

  const selectedPgd = pgds.find((p) => p.id.toString() === selectedPgdId);

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "Dashboard" },
        ]}
      >
        {/* Header */}
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">DASHBOARD PGD</h2>
            <div className="flex items-center gap-2">
              {isLoadingPgds ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </div>
              ) : error ? (
                <Button variant="outline" size="sm" onClick={loadPGDs}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reintentar
                </Button>
              ) : (
                <>
                  <Select value={selectedPgdId} onValueChange={setSelectedPgdId}>
                    <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                      <SelectValue placeholder="Seleccionar PGD" />
                    </SelectTrigger>
                    <SelectContent>
                      {pgds.map((pgd) => (
                        <SelectItem key={pgd.id} value={pgd.id.toString()}>
                          {`${pgd.anioInicio} - ${pgd.anioFin}`}
                          {pgd.estado === "VIGENTE" && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Vigente
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDashboard}
                    disabled={isLoadingDashboard}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${isLoadingDashboard ? "animate-spin" : ""}`}
                    />
                    Actualizar
                  </Button>

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        style={{ backgroundColor: "#018CD1", color: "white" }}
                        disabled={isExporting || !selectedPgdId}
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar a PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("excel")}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Exportar a Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
          {isLoadingDashboard ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
            </div>
          ) : !selectedPgdId ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BarChart3 className="h-12 w-12 mb-4" />
              <p className="text-lg">Seleccione un PGD para ver el dashboard</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PGD Info */}
              {selectedPgd && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedPgd.nombre || `PGD ${selectedPgd.anioInicio} - ${selectedPgd.anioFin}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Periodo: {selectedPgd.anioInicio} - {selectedPgd.anioFin}
                    </p>
                  </div>
                  <Badge
                    variant={selectedPgd.estado === "VIGENTE" ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {selectedPgd.estado}
                  </Badge>
                </div>
              )}

              {/* KPIs */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="Objetivos OEI"
                  value={stats?.totalOEI || 0}
                  subtitle="Objetivos Estratégicos Institucionales"
                  icon={Target}
                  color="#004272"
                />
                <KPICard
                  title="Objetivos OGD"
                  value={stats?.totalOGD || 0}
                  subtitle="Objetivos de Gobierno Digital"
                  icon={Target}
                  color="#018CD1"
                />
                <KPICard
                  title="Acciones Estratégicas"
                  value={stats?.totalAE || 0}
                  subtitle="Vinculadas al PGD"
                  icon={BarChart3}
                  color="#22C55E"
                />
                <KPICard
                  title="Proyectos + Actividades"
                  value={(stats?.totalProyectos || 0) + (stats?.totalActividades || 0)}
                  subtitle={`${stats?.totalProyectos || 0} Proyectos, ${stats?.totalActividades || 0} Actividades`}
                  icon={PieChartIcon}
                  color="#8B5CF6"
                />
              </div>

              {/* Progress */}
              {dashboard && dashboard.progresoGeneral > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Progreso General del PGD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={dashboard.progresoGeneral} className="flex-1" />
                      <span className="text-2xl font-bold">{dashboard.progresoGeneral.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Avance por OEI */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Avance por OEI
                    </CardTitle>
                    <CardDescription>
                      Comparativa entre avance planificado y real por Objetivo Estratégico
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.avanceOEIs && dashboard.avanceOEIs.length > 0 ? (
                      <AvanceOEIChart data={dashboard.avanceOEIs} />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <p>Sin datos de avance OEI disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Avance por OGD */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Avance por OGD
                    </CardTitle>
                    <CardDescription>
                      Comparativa entre avance planificado y real por Objetivo de Gobierno Digital
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.avanceOGDs && dashboard.avanceOGDs.length > 0 ? (
                      <AvanceOGDChart data={dashboard.avanceOGDs} />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <p>Sin datos de avance OGD disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Proyectos por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Proyectos por Estado
                    </CardTitle>
                    <CardDescription>
                      Distribución de proyectos según su estado actual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.proyectosPorEstado && dashboard.proyectosPorEstado.length > 0 ? (
                      <EstadoDistributionChart
                        data={dashboard.proyectosPorEstado}
                        title="Proyectos"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <p>Sin proyectos vinculados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actividades por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Actividades por Estado
                    </CardTitle>
                    <CardDescription>
                      Distribución de actividades según su estado actual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.actividadesPorEstado && dashboard.actividadesPorEstado.length > 0 ? (
                      <EstadoDistributionChart
                        data={dashboard.actividadesPorEstado}
                        title="Actividades"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <p>Sin actividades vinculadas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
