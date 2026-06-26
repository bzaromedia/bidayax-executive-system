import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@bidayax/ui";

const meta = {
  title: "Primitives/Cards",
  component: Card
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof Card>;

export const FoundationCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <Badge variant="accent">Foundation</Badge>
        <CardTitle>Governed card primitive</CardTitle>
        <CardDescription>
          A reusable container for future product surfaces. This is not a business card screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-content-secondary">
          Cards use token-backed radius, borders, surfaces, and typography.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary">Review primitive</Button>
      </CardFooter>
    </Card>
  )
};
