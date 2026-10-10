"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TASK_CONTEXT_OPTIONS } from "@/lib/task-context";

type TaskContextFieldProps = {
  open: boolean;
  value: string;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
};

export function TaskContextField({ open, value, onOpenChange, onChange }: TaskContextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit px-2 text-muted-foreground"
        onClick={() => onOpenChange(!open)}
      >
        {open ? "收起任务背景" : "任务背景（可选）"}
      </Button>
      {open ? (
        <>
          <div className="flex flex-wrap gap-2">
            {TASK_CONTEXT_OPTIONS.map((option) => {
              const selected = value === option.text;
              return (
                <Button
                  key={option.label}
                  type="button"
                  size="sm"
                  variant={selected ? "secondary" : "outline"}
                  onClick={() => onChange(selected ? "" : option.text)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          <Textarea
            id="task-context"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="选择上面的场景，或直接写读者、材料和完成标准"
            rows={4}
            className="resize-y"
          />
        </>
      ) : null}
    </div>
  );
}
