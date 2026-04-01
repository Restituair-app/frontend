import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CategoryCard = memo(function CategoryCard({ categoria, nome, icon: Icon, iconColor, cor, total, quantidade, ativo, onClick }) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
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
      </CardContent>
    </Card>
  );
});

export default CategoryCard;
