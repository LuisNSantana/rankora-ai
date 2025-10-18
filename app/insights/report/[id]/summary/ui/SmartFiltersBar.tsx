"use client";

import React, { useState } from "react";
import { Filter, Search, Calendar, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface SmartFiltersBarProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
}

export default function SmartFiltersBar({ onSearch, onFilterChange }: SmartFiltersBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    onFilterChange?.(value);
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setActiveFilters([]);
    onSearch?.("");
    onFilterChange?.("all");
  };

  const filterOptions = [
    { value: "high-impact", label: "🎯 Alto Impacto", color: "bg-emerald-500" },
    { value: "quick-wins", label: "⚡ Quick Wins", color: "bg-blue-500" },
    { value: "critical", label: "🚨 Crítico", color: "bg-red-500" },
    { value: "data-backed", label: "📊 Respaldado con Datos", color: "bg-purple-500" },
  ];

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Main filter row */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Buscar en el informe..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 h-10 border-2 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => handleSearch("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Type filter */}
          <Select value={selectedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48 h-10 border-2">
              <SelectValue placeholder="Tipo de insight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📋 Todos</SelectItem>
              <SelectItem value="opportunities">💡 Oportunidades</SelectItem>
              <SelectItem value="risks">⚠️ Riesgos</SelectItem>
              <SelectItem value="metrics">📊 Métricas</SelectItem>
              <SelectItem value="recommendations">🎯 Recomendaciones</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced filters toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Clear filters (only show if active) */}
          <AnimatePresence>
            {(searchQuery || selectedFilter !== "all" || activeFilters.length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Limpiar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2">
                <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
                  Filtros Avanzados
                </p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={activeFilters.includes(option.value) ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        activeFilters.includes(option.value)
                          ? `${option.color} text-white border-0`
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleFilter(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters summary */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-3 pt-3 border-t border-border"
            >
              <span className="text-xs text-muted-foreground">Filtros activos:</span>
              {activeFilters.map((filter) => {
                const option = filterOptions.find(o => o.value === filter);
                return (
                  <Badge key={filter} variant="secondary" className="text-xs">
                    {option?.label}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => toggleFilter(filter)}
                    />
                  </Badge>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
