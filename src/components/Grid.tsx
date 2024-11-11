/** Based on
      https://github.com/Fyrestar/THREE.InfiniteGridHelper by https://github.com/Fyrestar
      and https://github.com/threlte/threlte/blob/main/packages/extras/src/lib/components/Grid/Grid.svelte
        by https://github.com/grischaerbe and https://github.com/jerzakm
*/

import * as React from 'react'
import * as THREE from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '@react-three/drei/helpers/ts-utils'
import { shaderMaterial } from '@react-three/drei'

export type GridMaterialType = {
  /** Cell size, default: 0.5 */
  cellSize?: number
  /** Cell thickness, default: 0.5 */
  cellThickness?: number
  /** Cell color, default: black */
  cellColor?: THREE.ColorRepresentation
  /** Section size, default: 1 */
  sectionSize?: number
  /** Section thickness, default: 1 */
  sectionThickness?: number
  /** Section color, default: #2080ff */
  sectionColor?: THREE.ColorRepresentation
  /** Fade distance, default: 100 */
  fadeDistance?: number
  /** Fade strength, default: 1 */
  fadeStrength?: number
  /** Fade from camera (1) or origin (0), or somewhere in between, default: camera */
  fadeFrom?: number
  /** Material side, default: THREE.BackSide */
  side?: THREE.Side
}

export type GridProps = GridMaterialType & {
  /** Default plane-geometry arguments */
  args?: ConstructorParameters<typeof THREE.PlaneGeometry>
}

const GridMaterial = /* @__PURE__ */ shaderMaterial(
  {
    cellSize: 0.5,
    sectionSize: 1,
    fadeDistance: 100,
    fadeStrength: 1,
    fadeFrom: 1,
    cellThickness: 0.5,
    sectionThickness: 1,
    cellColor: /* @__PURE__ */ new THREE.Color(),
    sectionColor: /* @__PURE__ */ new THREE.Color(),
    worldCamProjPosition: /* @__PURE__ */ new THREE.Vector3(),
    worldPlanePosition: /* @__PURE__ */ new THREE.Vector3(),
  },
  /* glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform vec3 worldPlanePosition;
    uniform float fadeDistance;

    void main() {
      localPosition = position.xzy;
      localPosition *= 1.0 + fadeDistance;
      
      worldPosition = modelMatrix * vec4(localPosition, 1.0);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      vec3 from = worldCamProjPosition*vec3(fadeFrom);
      float dist = distance(from, worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
)

export const Grid: ForwardRefComponent<
  Omit<JSX.IntrinsicElements['mesh'], 'args'> & GridProps,
  THREE.Mesh
> = /* @__PURE__ */ React.forwardRef(
  (
    {
      args,
      cellColor = '#ffff00',
      sectionColor = '#2080ff',
      cellSize = 0.5,
      sectionSize = 1,
      fadeDistance = 1000,
      fadeStrength = 1,
      fadeFrom = 0,
      cellThickness = 0.25,
      sectionThickness = 0.5,
      side = THREE.DoubleSide,
      ...props
    }: Omit<JSX.IntrinsicElements['mesh'], 'args'> & GridProps,
    fRef: React.ForwardedRef<THREE.Mesh>,
  ) => {
    extend({ GridMaterial })

    const ref = React.useRef<THREE.Mesh>(null!)
    React.useImperativeHandle(fRef, () => ref.current, [])
    const plane = new THREE.Plane()
    const upVector = new THREE.Vector3(0, 1, 0)
    const zeroVector = new THREE.Vector3(0, 0, 0)
    useFrame((state) => {
      plane
        .setFromNormalAndCoplanarPoint(upVector, zeroVector)
        .applyMatrix4(ref.current.matrixWorld)

      const gridMaterial = ref.current.material as THREE.ShaderMaterial
      const worldCamProjPosition = gridMaterial.uniforms
        .worldCamProjPosition as THREE.Uniform<THREE.Vector3>
      const worldPlanePosition = gridMaterial.uniforms
        .worldPlanePosition as THREE.Uniform<THREE.Vector3>

      plane.projectPoint(state.camera.position, worldCamProjPosition.value)
      worldPlanePosition.value
        .set(0, 0, 0)
        .applyMatrix4(ref.current.matrixWorld)
    })

    const uniforms1 = {
      cellSize,
      sectionSize,
      cellColor,
      sectionColor,
      cellThickness,
      sectionThickness,
    }
    const uniforms2 = {
      fadeDistance,
      fadeStrength,
      fadeFrom,
    }

    return (
      <instancedMesh ref={ref} frustumCulled={false} {...props}>
        <gridMaterial
          transparent
          extensions-derivatives
          side={side}
          {...uniforms1}
          {...uniforms2}
        />
        <planeGeometry args={args} />
      </instancedMesh>
    )
  },
)
