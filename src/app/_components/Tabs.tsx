export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text-sm text-center text-neutral-9 ${className}`}>
      <div class="flex flex-wrap *:p-4 *:mb-px *:border-b-2 *:border-transparent [&>*.active]:text-blue-10 [&>*.active]:border-blue-10">
        {children}
      </div>
    </div>
  )
}

// This is still TODO
export const TabsExample = () => {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div class="space-y-4">
      <Tabs>
        <a
          href="#"
          class={activeTab === "home" ? "active" : ""}
          onClick={e => {
            e.preventDefault()
            setActiveTab("home")
          }}
        >
          Home
        </a>
        <a
          href="#"
          class={activeTab === "settings" ? "active" : ""}
          onClick={e => {
            e.preventDefault()
            setActiveTab("settings")
          }}
        >
          Settings
        </a>
      </Tabs>

      <div class="p-4 border border-neutral-6 rounded">
        {activeTab === "home" && <p>Home goes here...</p>}
        {activeTab === "settings" && <p>Settings goes here...</p>}
      </div>
    </div>
  )
}

import { useState } from "preact/hooks"
