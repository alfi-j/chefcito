"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

interface EditableListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main content of the list item
   */
  children: React.ReactNode
  /**
   * Whether the item is in edit mode
   */
  isEditing?: boolean
  /**
   * Callback when edit button is clicked
   */
  onEdit?: () => void
  /**
   * Callback when delete button is clicked
   */
  onDelete?: () => void
  /**
   * Whether to show the action buttons
   */
  showActions?: boolean
}

const EditableListItem = React.forwardRef<
  HTMLDivElement,
  EditableListItemProps
>(({ 
  className, 
  children, 
  isEditing = false, 
  onEdit, 
  onDelete, 
  showActions = true,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-2 p-2 hover:bg-muted rounded-md transition-colors",
        isEditing && "bg-muted",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={onEdit}
              aria-label="Edit item"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
})
EditableListItem.displayName = "EditableListItem"

export { EditableListItem }