import { createFileRoute } from '@tanstack/react-router'
import { CockpitPage } from '../features/cockpit/CockpitPage'

export const Route = createFileRoute('/')({ component: CockpitPage })
