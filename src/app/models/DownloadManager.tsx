import { Button, Page } from "../_components"
import { basename, fmtSize } from "../_util"
import { ModelsPage } from "./ModelsPage"
import { queue, current, cancel } from "./download"

export const DownloadManager = () => {
  return (
    <ModelsPage>
      <Page.Content>
        <div class="vstack items-center gap-4 my-4">
          {current.value && <DownloadProgress {...current.value} />}

          {!queue.value.length && <div class="border border-neutral-6 rounded bg-neutral-2 p-4">No downloads in progress.</div>}

          {queue.value.length > 1 && (
            <div>
              <strong>Next in queue</strong>
              <table>
                {queue.value.slice(1).map(job => (
                  <tr>
                    <td class="pr-2">{basename(job.url)}</td>
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
  const percent = size.value && (progress.value / size.value) * 100

  return (
    <div class="w-[30rem] p-4 rounded-md bg-sky-2 border border-sky-8 text-sky-12">
      <strong>Download in progress</strong>

      <div class="flex justify-between">
        <span>Downloading {basename(url)}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-7">
        <div class="h-1 bg-primary-9" style={`width: ${percent}%`}></div>
      </div>

      <div class="mt-4 flex justify-between">
        <span>
          {fmtSize(progress.value)} / {fmtSize(size.value)}
        </span>
        <Button onClick={() => cancel(current.value)}>Cancel</Button>
      </div>
    </div>
  )
}
