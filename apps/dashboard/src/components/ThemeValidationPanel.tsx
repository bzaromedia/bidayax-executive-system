import type { BrandThemeConfig } from "@bidayax/types";
import { validateBrandThemeConfig } from "@bidayax/card-customization";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";

type ThemeValidationPanelProps = {
  readonly settings: BrandThemeConfig;
};

export function ThemeValidationPanel({ settings }: ThemeValidationPanelProps) {
  const validation = validateBrandThemeConfig(settings);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Theme Validation</CardTitle>
            <CardDescription>
              Resolver checks color syntax and readable contrast before a
              customer theme is applied.
            </CardDescription>
          </div>
          <Badge variant={validation.valid ? "accent" : "neutral"}>
            {validation.valid ? "Valid" : "Needs review"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {validation.valid ? (
          <p className="text-sm text-content-secondary">
            This theme resolves through approved design tokens and contrast rules.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-content-secondary">
            {validation.issues.map((issue) => (
              <li key={`${String(issue.field)}-${issue.message}`}>
                {String(issue.field)}: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
