'use client';

/**
 * DailyCalendar Component
 *
 * Calendario mensual que muestra indicadores de dailies realizadas
 * Permite navegar entre meses y seleccionar días
 */

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DailyInfo {
  id: number;
  fecha: string;
  hasImpedimentos: boolean;
  totalParticipantes: number;
  asistentes: number;
}

interface DailyCalendarProps {
  dailies: DailyInfo[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  sprintFechaInicio?: string;
  sprintFechaFin?: string;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DailyCalendar({
  dailies,
  selectedDate,
  onSelectDate,
  sprintFechaInicio,
  sprintFechaFin,
}: DailyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Crear mapa de dailies por fecha para acceso rápido
  const dailiesByDate = useMemo(() => {
    const map = new Map<string, DailyInfo>();
    dailies.forEach((daily) => {
      const dateKey = daily.fecha.split('T')[0];
      map.set(dateKey, daily);
    });
    return map;
  }, [dailies]);

  // Obtener días del mes actual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Rango del sprint
  const sprintStart = sprintFechaInicio ? new Date(sprintFechaInicio) : null;
  const sprintEnd = sprintFechaFin ? new Date(sprintFechaFin) : null;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateInSprintRange = (date: Date) => {
    if (!sprintStart || !sprintEnd) return true;
    return date >= sprintStart && date <= sprintEnd;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-lg">
          {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-xs font-medium text-gray-500"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = formatDateKey(day);
          const dailyInfo = dailiesByDate.get(dateKey);
          const isToday = day.getTime() === today.getTime();
          const isSelected =
            selectedDate && day.getTime() === selectedDate.getTime();
          const isInSprintRange = isDateInSprintRange(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isPast = day < today;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-all',
                'hover:bg-gray-100',
                isToday && 'ring-2 ring-blue-500 ring-offset-1',
                isSelected && 'bg-blue-500 text-white hover:bg-blue-600',
                !isInSprintRange && 'text-gray-300',
                isWeekend && !isSelected && 'text-gray-400',
                dailyInfo && !isSelected && 'bg-blue-50',
              )}
              disabled={!isInSprintRange}
            >
              <span className={cn(
                'font-medium',
                isPast && !dailyInfo && !isSelected && 'text-gray-400'
              )}>
                {day.getDate()}
              </span>

              {/* Indicador de daily */}
              {dailyInfo && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  <Circle
                    className={cn(
                      'h-2 w-2',
                      isSelected ? 'fill-white text-white' : 'fill-blue-500 text-blue-500'
                    )}
                  />
                  {dailyInfo.hasImpedimentos && (
                    <AlertCircle
                      className={cn(
                        'h-2 w-2',
                        isSelected ? 'text-yellow-200' : 'text-red-500'
                      )}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-4 p-3 border-t text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
          <span>Daily realizada</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span>Con impedimentos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded ring-2 ring-blue-500" />
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}
