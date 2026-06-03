import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  const _values = Array.isArray(value)
    ? value
    : typeof value === "number"
      ? [value]
      : Array.isArray(defaultValue)
        ? defaultValue
        : typeof defaultValue === "number"
          ? [defaultValue]
          : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}>
      <SliderPrimitive.Control
        className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full border border-border/80 bg-border select-none data-horizontal:h-2.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-2.5">
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-green-600 select-none data-horizontal:h-full data-vertical:w-full dark:bg-green-500" />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-4 shrink-0 rounded-full border-2 border-green-600 bg-background shadow-md ring-2 ring-green-600/25 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-green-600/40 focus-visible:ring-green-600/40 focus-visible:outline-hidden active:ring-green-600/40 disabled:pointer-events-none disabled:opacity-50 dark:border-green-500 dark:ring-green-500/25" />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider }
