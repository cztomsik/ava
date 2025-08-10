import { Page } from "./_components"
import { AlertExample } from "./_components/Alert"
import { AutoGrowTextareaExample } from "./_components/AutoGrowTextarea"
import { BadgeExample } from "./_components/Badge"
import { CheckboxExample } from "./_components/Checkbox"
import { ListExample } from "./_components/List"
import { MarkdownExample } from "./_components/Markdown"
import { SelectExample } from "./_components/Select"
import { SliderExample } from "./_components/Slider"
import { TableExample } from "./_components/Table"
import { TabsExample } from "./_components/Tabs"
import { ValueExample } from "./_components/Value"

const Section = ({ title, children }) => (
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-2 text-neutral-11">{title}</h2>
    <div class="py-4">{children}</div>
  </section>
)

export const LibraryPage = () => {
  return (
    <Page>
      <Page.Header title="Component Library"></Page.Header>

      <Page.Content>
        <Section title="Alert">
          <AlertExample />
        </Section>

        <Section title="AutoGrowTextarea">
          <AutoGrowTextareaExample />
        </Section>

        <Section title="Badge">
          <BadgeExample />
        </Section>

        <Section title="Checkbox">
          <CheckboxExample />
        </Section>

        <Section title="List">
          <ListExample />
        </Section>

        <Section title="Markdown">
          <MarkdownExample />
        </Section>

        <Section title="Select">
          <SelectExample />
        </Section>

        <Section title="Slider">
          <SliderExample />
        </Section>

        <Section title="Table">
          <TableExample />
        </Section>

        <Section title="Tabs">
          <TabsExample />
        </Section>

        <Section title="Value">
          <ValueExample />
        </Section>
      </Page.Content>
    </Page>
  )
}
