# 🥓 CrispBacon Design System

> **Genera reportes en el mismo tiempo que preparas un bacon**

Nuestra paleta de colores se inspira en los colores del logo: el rojo/naranja cálido (tocino, velocidad, pasión) y el azul brillante (IA, tecnología, datos).

---

## 🎨 Colores de Marca (Consistentes en todos los modos)

Estos colores anclan la identidad de CrispBacon y se mantienen consistentes en light y dark mode.

| Token Tailwind | Código HEX | Variable CSS | Uso Estratégico |
|---------------|------------|--------------|-----------------|
| `brand-bacon` | `#FF6B35` | `--color-brand-bacon` | **Naranja Primario** - El color del tocino crujiente. Botones principales, indicadores de éxito, acentos cálidos |
| `brand-ai` | `#007BFF` | `--color-brand-ai` | **Azul Secundario** - El color de la IA y los datos. Enlaces, iconos de datos, elementos interactivos secundarios |
| `brand-meat` | `#D63031` | `--color-brand-meat` | **Rojo Profundo** - El color de la carne. Advertencias críticas, estados hover/active del botón primario |
| `neutral-data` | `#1E90FF` | `--color-neutral-data` | **Azul Eléctrico** - Para gráficos, chispas y elementos de análisis de datos |

---

## ☀️ Light Mode (Modo Claro)

El Light Mode utiliza un fondo blanco puro para maximizar el contraste y dar una sensación de limpieza y profesionalismo.

### Tokens de Color

| Uso | Código HEX | Tailwind Class | Variable CSS | Aplicación |
|-----|------------|----------------|--------------|------------|
| **Fondo Principal** | `#FFFFFF` | `bg-bg-primary` | `--color-bg-primary` | Base limpia. El lienzo donde brilla el contenido |
| **Superficie Secundaria** | `#F5F5F5` | `bg-bg-secondary` | `--color-bg-secondary` | Tarjetas, modals, paneles laterales. Da elevación visual |
| **Texto Principal** | `#1C1C1C` | `text-text-primary` | `--color-text-primary` | Negro suave para cuerpo y headings (alto contraste) |
| **Texto Secundario** | `#666666` | `text-text-secondary` | `--color-text-secondary` | Metadatos, subtítulos, notas a pie de página |
| **Acento Primario** | `#FF6B35` | `bg-accent-primary` | `--color-accent-primary` | Botones, estados activos, progreso (la promesa de rapidez) |
| **Bordes/Divisores** | `#E0E0E0` | `border-border-subtle` | `--color-border-subtle` | Separaciones y líneas sutiles |

### Estrategia Premium
```jsx
// Usa sombras suaves en tarjetas para efecto flotante
<Card className="bg-bg-secondary shadow-lg">
  {/* Contenido */}
</Card>
```

---

## 🌙 Dark Mode (Modo Oscuro)

El Dark Mode usa tonos oscuros profundos para un look tecnológico de alta gama. Los textos usan blancos "sucios" para reducir la fatiga visual.

### Tokens de Color

| Uso | Código HEX | Tailwind Class | Variable CSS | Aplicación |
|-----|------------|----------------|--------------|------------|
| **Fondo Principal** | `#121212` | `bg-bg-primary` | `--color-bg-primary` | Negro muy oscuro (OLED) para contraste profundo y moderno |
| **Superficie Secundaria** | `#1E1E1E` | `bg-bg-secondary` | `--color-bg-secondary` | Tarjetas y paneles. Más claro que el fondo para crear profundidad |
| **Texto Principal** | `#EDEDED` | `text-text-primary` | `--color-text-primary` | Blanco suave para prevenir blooming (brillo excesivo) |
| **Texto Secundario** | `#A0A0A0` | `text-text-secondary` | `--color-text-secondary` | Metadatos. Contraste suficiente sin competir |
| **Acento Primario** | `#FF6B35` | `bg-accent-primary` | `--color-accent-primary` | Mismo acento para mantener identidad (calidez del tocino) |
| **Bordes/Divisores** | `#333333` | `border-border-subtle` | `--color-border-subtle` | Líneas oscuras pero visibles |

---

## 🎯 Guía de Uso

### Botones Principales
```jsx
// Botón primario con brand-bacon
<Button className="bg-brand-bacon hover:bg-brand-meat text-white">
  Generar Reporte
</Button>

// Botón secundario con brand-ai
<Button variant="outline" className="border-brand-ai text-brand-ai hover:bg-brand-ai/10">
  Ver Datos
</Button>
```

### Tarjetas y Superficies
```jsx
// Tarjeta con elevación en light mode
<Card className="bg-bg-secondary shadow-lg rounded-lg">
  <CardHeader>
    <CardTitle className="text-text-primary">Análisis Rápido</CardTitle>
    <CardDescription className="text-text-secondary">
      Listo en 3 minutos
    </CardDescription>
  </CardHeader>
</Card>
```

### Estados y Feedback
```jsx
// Estado de éxito
<Badge className="bg-brand-bacon text-white">Completado</Badge>

// Estado de advertencia
<Alert className="border-brand-meat bg-brand-meat/10">
  <AlertDescription className="text-brand-meat">
    Acción requerida
  </AlertDescription>
</Alert>

// Estado informativo
<div className="flex items-center gap-2 text-brand-ai">
  <DatabaseIcon />
  <span>Procesando con IA</span>
</div>
```

### Gráficos y Visualizaciones
```jsx
// Usa la paleta de charts predefinida
<ChartContainer config={chartConfig}>
  <BarChart data={data}>
    <Bar dataKey="ventas" fill="var(--color-chart-1)" /> {/* brand-bacon */}
    <Bar dataKey="predicciones" fill="var(--color-chart-2)" /> {/* brand-ai */}
  </BarChart>
</ChartContainer>
```

---

## 📊 Paleta de Charts

Los gráficos usan una paleta coherente basada en los colores de marca:

1. **Chart 1** (`#FF6B35`) - brand-bacon - Datos principales, ventas
2. **Chart 2** (`#007BFF`) - brand-ai - Predicciones, análisis IA
3. **Chart 3** (`#1E90FF`) - neutral-data - Datos secundarios, comparativas
4. **Chart 4** (`#D63031`) - brand-meat - Alertas, descensos
5. **Chart 5** (`#666666` / `#A0A0A0`) - Datos terciarios

---

## ✅ Checklist de Accesibilidad

- ✅ Contraste mínimo WCAG AA (4.5:1) en todos los textos
- ✅ Blanco "sucio" en dark mode para prevenir fatiga visual
- ✅ Estados interactivos claramente diferenciados
- ✅ Colores de marca consistentes en ambos modos

---

## 🚀 Migración desde la Paleta Anterior

### Buscar y Reemplazar

| Antiguo | Nuevo | Contexto |
|---------|-------|----------|
| `bg-primary` | `bg-brand-bacon` | Botones principales |
| `text-primary` | `text-text-primary` | Texto de cuerpo |
| `bg-secondary` | `bg-bg-secondary` | Tarjetas y superficies |
| `border-border` | `border-border-subtle` | Bordes sutiles |

### Componentes Actualizados Automáticamente

Todos los componentes heredan los nuevos colores automáticamente a través de las variables CSS:
- ✅ Buttons
- ✅ Cards
- ✅ Badges
- ✅ Tables
- ✅ Charts
- ✅ Sidebar

---

**¿Preguntas?** Consulta el archivo `app/globals.css` para ver todas las variables CSS disponibles.
