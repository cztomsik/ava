import { Layout, PageContent, PageHeader } from "../_components"
import { ChatSession } from "./ChatSession"

export const Chat = ({ params }) => {
  // TODO: load by id

  return (
    <>
      <PageHeader title="Chat" description="Dialog-based interface" />

      <PageContent>
        <Layout>
          <aside class="print:hidden">
            <PreviousChats />
          </aside>

          <ChatSession />
        </Layout>
      </PageContent>
    </>
  )
}

const PreviousChats = () => {
  return null
  // return (
  //   <>
  //     <div class="group">
  //       <div>Previous</div>
  //       <div class="vstack gap-2 my-2">
  //         <a class="active" href="#">
  //           Poem about JavaScript
  //         </a>
  //         <a href="#">Invoke Clang from Zig</a>
  //       </div>
  //     </div>
  //   </>
  // )
}
