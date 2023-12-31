import { Button, Modal } from "../_components"
import { basename, humanSize } from "../_util"

export const DownloadModal = ({ url, size, progress, onCancel }) => {
  const percent = (progress.value / size) * 100

  return (
    <Modal class="w-[30rem]" title={`Download in Progress`} onClose={onCancel}>
      <div class="flex justify-between">
        <span>Downloading {basename(url)}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-7">
        <div class="h-1 bg-blue-9" style={`width: ${percent}%`}></div>
      </div>

      <div class="mt-4 flex justify-between">
        <span>
          {humanSize(progress.value)} / {humanSize(size)}
        </span>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Modal>
  )
}
