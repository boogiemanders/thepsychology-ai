import { MessageSquare } from 'lucide-react'

export function EmptyTranscript({ noSession = false }: { noSession?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
      <div className="rounded-full bg-muted p-3 mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {noSession ? 'Select a session' : 'No messages yet'}
      </p>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        {noSession
          ? 'Choose a session from the table above to view the conversation'
          : 'This session has no messages recorded'}
      </p>
    </div>
  )
}
