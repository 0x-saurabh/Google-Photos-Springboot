import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Check that the Pixora backend is running and try again.",
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <Empty role="alert" className="border border-destructive/30 bg-destructive/5 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry} disabled={retrying}>
            {retrying ? <Spinner className="size-4" /> : <RotateCcw />}
            Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
