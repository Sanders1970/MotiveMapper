'use client';

import { useFormStatus } from 'react-dom';
import { scanTextAction, type ActionState } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MotivationIcon } from './motivation-icon';
import { useEffect, useRef, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        "Scan Text"
      )}
    </Button>
  );
}

function ResultsDisplay({ state }: { state: ActionState }) {
  if (!state.motivations && !state.summary) {
    return null;
  }

  return (
    <Card className="mt-6 animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="font-headline">Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-muted-foreground leading-relaxed">{state.summary}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Identified Motivations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.motivations?.map((motivation, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-shadow hover:shadow-md">
                <div className="flex-shrink-0">
                  <MotivationIcon motivation={motivation} className="h-6 w-6 text-accent" />
                </div>
                <span className="font-medium flex-1">{motivation}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MotiveMapperClient() {
  const [state, formAction] = useActionState(scanTextAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);
  
  // Reset form if results are successful
  useEffect(() => {
    if(state.summary && state.motivations && !state.error) {
        formRef.current?.reset();
    }
  }, [state.summary, state.motivations, state.error]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Motivational Driver Analysis</CardTitle>
          <CardDescription>
            Enter text below to analyze its underlying motivational drivers. For example, paste a job description, performance review, or an important email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <Textarea
              name="text"
              placeholder="Paste your text here..."
              className="min-h-[200px] resize-y"
              required
              defaultValue={state.input}
            />
            <div className="flex justify-end">
                <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
      
      <ResultsDisplay state={state} />
    </div>
  );
}
