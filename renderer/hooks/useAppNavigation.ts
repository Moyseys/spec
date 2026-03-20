import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { AppSection } from '../types/app'
import { SIDEBAR_ITEMS } from '../utils/appConstants'

interface UseAppNavigationOptions {
  onSectionChange?: (section: AppSection) => void
}

export const useAppNavigation = (options: UseAppNavigationOptions = {}) => {
  const { onSectionChange } = options

  const [activeSection, setActiveSection] = useState<AppSection>('chat')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const activeSidebarItem =
    SIDEBAR_ITEMS.find((item) => item.id === activeSection) ?? SIDEBAR_ITEMS[0]

  const goToSection = (section: AppSection) => {
    setActiveSection(section)
    onSectionChange?.(section)
  }

  const handleSidebarKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const currentIndex = SIDEBAR_ITEMS.findIndex((item) => item.id === activeSection)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = (currentIndex + 1) % SIDEBAR_ITEMS.length
      goToSection(SIDEBAR_ITEMS[nextIndex].id)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const previousIndex =
        (currentIndex - 1 + SIDEBAR_ITEMS.length) % SIDEBAR_ITEMS.length
      goToSection(SIDEBAR_ITEMS[previousIndex].id)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      goToSection(SIDEBAR_ITEMS[0].id)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      goToSection(SIDEBAR_ITEMS[SIDEBAR_ITEMS.length - 1].id)
    }
  }

  return {
    activeSection,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeSidebarItem,
    goToSection,
    handleSidebarKeyDown,
  }
}
