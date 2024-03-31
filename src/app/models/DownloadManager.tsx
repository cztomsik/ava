import { Button, Page } from "../_components"
import { basename, fmtSize } from "../_util"
import { ModelsPage } from "./ModelsPage"
import { queue, current, cancel } from "./download"

export const DownloadManager = () => {
  return (
    <ModelsPage>
      <Page.Content>
        <div class="flex flex-wrap items-start gap-4 mb-4">
          {current.value && <DownloadProgress {...current.value} />}

          {!queue.value.length && <div>No downloads in progress.</div>}

          {queue.value.length > 1 && (
            <div>
              <strong>Next in queue</strong>
              <table>
                {queue.value.slice(1).map(job => (
                  <tr>
                    <td>{basename(job.url)}</td>
                    <td>
                      <Button onClick={() => cancel(job)}>Cancel</Button>
                    </td>
                  </tr>
                ))}
              </table>
            </div>
          )}
        </div>
      </Page.Content>
    </ModelsPage>
  )
}

const DownloadProgress = ({ url, size, progress }) => {
  const percent = size && (progress.value / size) * 100

  return (
    <div class="w-[30rem] p-4 rounded-md bg(sky-2) border(1 sky-8) text-sky(12)">
      <strong>Download in progress</strong>

      <div class="flex justify-between">
        <span>Downloading {basename(url)}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-7">
        <div class="h-1 bg-blue-9" style={`width: ${percent}%`}></div>
      </div>

      <div class="mt-4 flex justify-between">
        <span>
          {fmtSize(progress.value)} / {fmtSize(size)}
        </span>
        <Button onClick={() => cancel(current.value)}>Cancel</Button>
      </div>
    </div>
  )
}
