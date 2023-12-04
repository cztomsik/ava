import { Page } from "../_components"
import { ChatList } from "./ChatList"
import { ChatSession } from "./ChatSession"
import { router } from "../router"

export const Chat = ({ params: { id } }) => {
  return (
    <Page>
      <Page.List as={ChatList} sizes={[200, 200, 600]} class="max-md:hidden" value={id} onSelect={handleSelect} />

      <ChatSession id={id} />
    </Page>
  )
}

const handleSelect = id => router.navigate(`/chat/${id}`)
