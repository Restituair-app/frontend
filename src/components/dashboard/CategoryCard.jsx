import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

const CategoryCard = memo(function CategoryCard({
  categoria,
  nome,
  icon: Icon,
  iconColor,
  cor,
  total,
  quantidade,
  ativo,
  onClick,
  tooltipText,
  tooltipOpen,
  onTooltipOpenChange,
}) {
  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
        ativo ? "ring-2 ring-blue-500 shadow-lg" : ""
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-lg", cor, "bg-opacity-20")}>
            {Icon ? <Icon className={cn("w-5 h-5", iconColor || 'text-foreground')} /> : null}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{quantidade} notas</p>
          </div>
        </div>
        <h3 className="font-semibold text-foreground text-xs md:text-sm mb-1">{nome}</h3>
        <p className="text-base md:text-lg font-bold text-foreground">
          R$ {total.toFixed(2)}
        </p>
        {tooltipText ? (
          <Popover open={tooltipOpen} onOpenChange={onTooltipOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Ver explicação sobre ${nome}`}
                className="absolute bottom-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Info className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="center"
              sideOffset={8}
              className="z-[300] w-64 whitespace-pre-line rounded-lg border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold leading-relaxed text-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-slate-950" />
              {tooltipText}
            </PopoverContent>
          </Popover>
        ) : null}
      </CardContent>
    </Card>
  );
});

export default CategoryCard;
