<script lang="ts">
export default {
  name: "image-zoom",
};
</script>
<script setup lang="ts">
import {
  watch,
  type ImgHTMLAttributes,
  type ComponentPublicInstance,
  PropType,
} from "vue";
import mediumZoom, { type Zoom, type ZoomOptions } from "medium-zoom";

interface Props extends ImgHTMLAttributes {
  options?: ZoomOptions;
}

// const defaultZoomOptions = {

// };

const props = defineProps({
  options: {
    type: Object as PropType<ZoomOptions>,
    default: () => ({
      background: "#212530",
    }),
  },
});

let zoom: Zoom | null = null;

function getZoom() {
  if (zoom === null) {
    zoom = mediumZoom(props.options);
  }

  return zoom;
}

function attachZoom(ref: Element | ComponentPublicInstance | null) {
  const image = ref as HTMLImageElement | null;
  const zoom = getZoom();

  if (image) {
    zoom.attach(image);
  } else {
    zoom.detach();
  }
}

watch(
  () => props.options,
  (options) => {
    const zoom = getZoom();
    zoom.update(options || {});
  }
);
</script>

<template>
  <img :ref="attachZoom" class="customImage-wrapper" />
</template>

<style scoped>
.customImage-wrapper {
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: var(--vp-c-box-shadow);
}
</style>
