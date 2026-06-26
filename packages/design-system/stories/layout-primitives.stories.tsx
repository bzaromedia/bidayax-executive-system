import type { Meta, StoryObj } from "@storybook/react";
import { Container, Grid, Section, Stack, Surface } from "@bidayax/ui";

const meta = {
  title: "Primitives/Layout"
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const LayoutPrimitives: Story = {
  render: () => (
    <Section>
      <Container size="lg">
        <Stack gap={6}>
          <div>
            <h1 className="font-heading text-2xl font-semibold">Layout primitives</h1>
            <p className="mt-2 text-sm text-content-secondary">
              Foundation blocks for future responsive interfaces.
            </p>
          </div>
          <Grid columns={3} gap={4}>
            {["Container", "Stack", "Grid"].map((item) => (
              <Surface key={item} tone="panel" className="p-5">
                <h2 className="font-heading font-semibold">{item}</h2>
                <p className="mt-2 text-sm text-content-secondary">
                  Reusable, token-backed layout primitive.
                </p>
              </Surface>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  )
};
