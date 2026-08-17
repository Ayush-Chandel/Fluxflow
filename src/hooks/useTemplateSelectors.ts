import { useTemplateStore } from "@/store/templateStore"
import type { Template, TemplateType } from "@/types/template"
import { useMemo } from "react"

export function useTemplateList(type:TemplateType): Template[] {
  const templatesMap = useTemplateStore((s) => s.templates)
  return useMemo(() => Object.values(templatesMap)
    .filter((template)=>(template.type === type))
    .sort((a, b) => a.name.localeCompare(b.name)), [templatesMap,type])
}

export function useTemplate(templateId: string | undefined): Template | undefined {
  return useTemplateStore((s) => (templateId ? s.templates[templateId] : undefined))
}

export function useDefaultTemplate(type: TemplateType): Template | undefined {
  const templatesMap = useTemplateStore((s) => s.templates)
  return useMemo(
    () => Object.values(templatesMap).find((template) => template.type === type && template.isDefault),
    [templatesMap, type],
  )
}