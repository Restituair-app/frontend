import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  onInfoClick,
  infoTooltip,
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hasInfo = Boolean(onInfoClick || infoTooltip);

  const infoButton = (
    <button
      type="button"
      aria-label={`Ver explicação sobre ${nome}`}
      className="absolute bottom-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={(event) => {
        event.stopPropagation();
        if (infoTooltip) {
          setTooltipOpen((current) => !current);
          return;
        }
        onInfoClick?.();
      }}
    >
      <Info className="h-4 w-4" />
    </button>
  );

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
        {hasInfo && infoTooltip ? (
          <TooltipProvider>
            <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <TooltipTrigger asChild>{infoButton}</TooltipTrigger>
              <TooltipContent className="max-w-sm whitespace-pre-line text-sm leading-5">
                {infoTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : hasInfo ? infoButton : null}
      </CardContent>
    </Card>
  );
});

export default CategoryCard;
