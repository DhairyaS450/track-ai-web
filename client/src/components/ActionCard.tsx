import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, Edit, RotateCcw, CheckCircle, AlertTriangle, Trash } from "lucide-react";

type ActionType = "create" | "update" | "delete";

interface ActionDetail {
  label: string;
  before?: string | number | boolean;
  after?: string | number | boolean;
}

export interface ActionCardProps {
  title: string;
  type: ActionType;
  entityType: string;
  details?: ActionDetail[];
  onEdit?: () => void;
  onUndo?: () => void;
  timestamp?: Date;
  children?: ReactNode;
}

export function ActionCard({
  title,
  type,
  entityType,
  details,
  onEdit,
  onUndo,
  timestamp = new Date(),
  children,
}: ActionCardProps) {
  const getIcon = () => {
    switch (type) {
      case "create":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "update":
        return <Edit className="h-5 w-5 text-blue-500" />;
      case "delete":
        return <Trash className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getActionTitle = () => {
    switch (type) {
      case "create":
        return `Created ${entityType}`;
      case "update":
        return `Updated ${entityType}`;
      case "delete":
        return `Deleted ${entityType}`;
      default:
        return `Action on ${entityType}`;
    }
  };

  const getActionColor = () => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "";
    }
  };

  return (
    <Card className={`mb-4 border-l-4 ${type === "create" ? "border-l-green-500" : type === "update" ? "border-l-blue-500" : "border-l-red-500"}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={getActionColor()}>
            {getActionTitle()}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {timestamp.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {details && details.length > 0 && (
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium">{detail.label}</p>
                {type === "update" && detail.before !== undefined && detail.after !== undefined ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="line-through text-muted-foreground">{String(detail.before)}</div>
                    <span>→</span>
                    <div className="font-medium">{String(detail.after)}</div>
                  </div>
                ) : (
                  <div className="mt-1">{detail.after !== undefined ? String(detail.after) : String(detail.before)}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {children}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex gap-2 w-full justify-end">
          {type === "delete" && onUndo && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUndo}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Undo
            </Button>
          )}
          {(type === "create" || type === "update") && onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 