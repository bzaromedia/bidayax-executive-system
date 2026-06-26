import type { Meta, StoryObj } from "@storybook/react";
import { Input, Label, Stack } from "@bidayax/ui";

const meta = {
  title: "Primitives/Inputs",
  component: Input
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof Input>;

export const TextInput: Story = {
  render: () => (
    <Stack gap={2} className="max-w-sm">
      <Label htmlFor="example-input">Contact field primitive</Label>
      <Input id="example-input" placeholder="name@example.com" />
    </Stack>
  )
};
