import { EventForm } from '@/components/organizer/event-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { eventService } from '@/lib/firestore-service';

interface EditEventPageProps {
  params: { id: string };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const event = await eventService.getEvent(params.id);

  if (!event) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Event Not Found</h1>
        <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
      </div>
    );
  }

  const initialData = {
    title: event.title,
    description: event.description,
    startDate: event.startDate?.toDate().toISOString().slice(0, 16),
    endDate: event.endDate?.toDate().toISOString().slice(0, 16),
    venue: event.venue,
    venueMapUrl: event.venueMapUrl,
    primaryColor: event.branding?.primaryColor,
    logoUrl: event.branding?.logoUrl,
    allowPublicRegistration: event.settings.allowPublicRegistration,
    requireApproval: event.settings.requireApproval,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
        <p className="text-muted-foreground">
          Update your event information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Update the information about your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm eventId={params.id} initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
