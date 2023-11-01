import { List } from "../_components"
import { useApi, useResize, useLocalStorage } from "../_hooks"

export const ChatList = ({ class: className = "", value, onSelect, ...props }) => {
  const width = useLocalStorage("chat.list.width", 200)
  const { style, resizeHandle } = useResize({ width, minWidth: 200, maxWidth: 600 })

  const { data } = useApi("chat")

  return (
    <nav class={`relative overflow-hidden ${className}`} {...props}>
      <List class="h-full max-h-full" style={style}>
        <List.Item selected={!value} onFocus={() => onSelect("")}>
          <List.Item.Title>New chat</List.Item.Title>
          <List.Item.Subtitle>Start a new chat with a model.</List.Item.Subtitle>
        </List.Item>

        {data?.map(({ id, name, last_message }) => (
          <List.Item key={id} selected={value === "" + id} onFocus={() => onSelect(id)}>
            <List.Item.Title>{name}</List.Item.Title>
            <List.Item.Subtitle>{last_message || "\xa0"}</List.Item.Subtitle>
          </List.Item>
        ))}

        {resizeHandle}
      </List>
    </nav>
  )
}
