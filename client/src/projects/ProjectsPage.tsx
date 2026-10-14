import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

// Placeholder until the project list is built in Phase 8.
export default function ProjectsPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
      <p className="text-muted-foreground">Projects will be listed here.</p>
      <Button variant="outline" asChild>
        <Link to="/login">Go to log in</Link>
      </Button>
    </section>
  );
}
