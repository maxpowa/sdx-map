import { shaderMaterial } from '@react-three/drei'
import { extend, Object3DNode } from '@react-three/fiber'
import { Color } from 'three'
import * as THREE from 'three'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      meshFresnelMaterial: Object3DNode<
        THREE.ShaderMaterial,
        typeof THREE.ShaderMaterial
      >
    }
  }
}

export default function MeshFresnelMaterial({
  fresnelColor = '#02feff', // fresnel color
  baseColor = '#0777fd', // base mesh color
  amount = 1.5, // how much fresnel
  offset = 0.05, // offset for fine grain control
  intensity = 1.5, // color threshold multiplier
  fresnelAlpha = 1, // alpha of the fresnel effect over the diffused color
  baseAlpha = 1, // alpha of the base color
}) {
  const uniforms = {
    uFresnelColor: new Color(fresnelColor),
    uBaseColor: new Color(baseColor),
    uBaseAlpha: baseAlpha,
    uFresnelAmt: amount,
    uFresnelOffset: offset,
    uFresnelIntensity: intensity,
    uFresnelAlpha: fresnelAlpha,
  }

  const vertexShader = /*glsl*/ `

    out vec3 vView;
    out vec3 vNormal;

    void main()
    {
        vec3 objectPosition = ( modelMatrix * vec4( position, 1.0 ) ).xyz; // object space coordinates

        vView = normalize( cameraPosition - objectPosition ); // view direction in object space
        vNormal = normalize( ( modelMatrix * vec4( normal, 0.0 ) ).xyz ); // normalized object space normals

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }

  `
  const fragmentShader = /*glsl*/ `

    uniform vec3 uFresnelColor;
    uniform vec3 uBaseColor;
    uniform float uBaseAlpha;
    uniform float uFresnelAmt;
    uniform float uFresnelOffset;
    uniform float uFresnelIntensity;
    uniform float uFresnelAlpha;

    in vec3 vView;
    in vec3 vNormal;

    float lambertLighting( vec3 normal, vec3 viewDirection )
    {
        return max( dot( normal, viewDirection ), 0.0 );
    }

    float fresnelFunc( float amount, float offset, vec3 normal, vec3 view)
    {
        return offset + ( 1.0 - offset ) * pow( 1.0 - dot( normal , view ), amount );
    }

    void main()
    {
        // fresnel color
        float fresnel = fresnelFunc( uFresnelAmt, uFresnelOffset, vNormal, vView );
        vec3 fresnelColor = ( uFresnelColor * fresnel ) * uFresnelIntensity;

        // lambert color
        float diffuse = lambertLighting( vNormal, vView );
        vec3 diffuseColor = uBaseColor * diffuse;

        vec3 finalColor = mix( diffuseColor, fresnelColor, fresnel * uFresnelAlpha );

        float alpha = uBaseAlpha;

        gl_FragColor = vec4( fresnelColor, uBaseAlpha );
    }

  `

  const MeshFresnelMaterial = shaderMaterial(
    uniforms,
    vertexShader,
    fragmentShader,
  )

  extend({ MeshFresnelMaterial })

  return (
    <meshFresnelMaterial
      key={MeshFresnelMaterial.key}
      transparent={true}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  )
}
