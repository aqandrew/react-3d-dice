import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as THREE from 'three'
import { Canvas } from 'react-three-fiber'
import { Tetrahedron, Box, Octahedron, Polyhedron, Dodecahedron, Icosahedron } from '@react-three/drei'
import { Physics, usePlane, useBox, useConvexPolyhedron } from 'use-cannon'
import niceColors from 'nice-color-palettes'
import './styles.css'

const textColor = 'white'
const dieColor = 'indigo'

const calculateTextureSize = (approx) => {
  return Math.max(128, Math.pow(2, Math.floor(Math.log(approx) / Math.log(2))))
}

const createTextTexture = (text, color, backColor) => {
  // TODO Set size/textMargin for each shape
  const size = 100
  const textMargin = 1

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const ts = calculateTextureSize(size / 2 + size * textMargin) * 2
  canvas.width = canvas.height = ts
  context.font = ts / (1 + 2 * textMargin) + 'pt Arial'
  context.fillStyle = backColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = color
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  if (text === 6 || text === 9) {
    context.fillText('  .', canvas.width / 2, canvas.height / 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

const createUvs = (sides, fl, tab, af) => {
  // TODO Store tab and af as variables for each shape

  const uvs = []
  const aa = (Math.PI * 2) / fl

  for (let i = 0; i < sides; ++i) {
    for (let j = 0; j < fl - 2; ++j) {
      for (let k = 0; k < 3; ++k) {
        const theta = aa * (j + k)

        uvs.push(
          // u
          (Math.cos(theta + af) + 1 + tab) / 2 / (1 + tab),
          // v
          (Math.sin(theta + af) + 1 + tab) / 2 / (1 + tab)
        )
      }
    }
  }

  return new Float32Array(uvs)
}

const Plane = ({ color, ...props }) => {
  const [ref] = usePlane(() => ({ ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
      <meshPhongMaterial attach="material" color={color} />
    </mesh>
  )
}

const D4 = (props) => {
  const sides = 4
  const verticesPerFace = 3
  const radius = 2
  const tetrahedronGeometry = new THREE.TetrahedronGeometry(radius)
  const [ref, api] = useConvexPolyhedron(() => {
    return {
      args: tetrahedronGeometry,
      mass: 1,
      ...props
    }
  })

  // Defining groups allows us to use a material array for BufferGeometry
  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < sides; i++) {
        ref.current.geometry.addGroup(i * verticesPerFace, verticesPerFace, i)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Tetrahedron args={radius} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {/* TODO Write texture creation function that's specific to D4 */}
      <meshPhongMaterial attachArray="material" color="grey" />
      <meshPhongMaterial attachArray="material" color="white" />
      <meshPhongMaterial attachArray="material" color="brown" />
      <meshPhongMaterial attachArray="material" color="black" />
    </Tetrahedron>
  )
}

const D6 = (props) => {
  const sides = 6
  const radius = 2.5
  const [ref, api] = useBox(() => ({ args: [radius, radius, radius], mass: 1, ...props }))

  return (
    <Box args={[radius, radius, radius]} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {Array.from(Array(sides)).map((_, i) => (
        <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
      ))}
    </Box>
  )
}

const D8 = (props) => {
  const sides = 8
  const radius = 2
  const verticesPerFace = 3
  const octahedronGeometry = new THREE.OctahedronGeometry(radius)
  const [ref, api] = useConvexPolyhedron(() => {
    return {
      args: octahedronGeometry,
      mass: 1,
      ...props
    }
  })

  // Defining groups allows us to use a material array for BufferGeometry
  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < sides; i++) {
        ref.current.geometry.addGroup(i * verticesPerFace, verticesPerFace, i)
      }

      ref.current.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(createUvs(sides, verticesPerFace, 0, -Math.PI / 8), 2))
      console.log(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Octahedron args={radius} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {Array.from(Array(sides)).map((_, i) => (
        <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
      ))}
    </Octahedron>
  )
}

const D10 = (props) => {
  const sides = 10
  const verticesPerFace = 6 // A quadrilateral is made of 2 triangles
  const radius = 2
  const vertices = [
    [0, 0, 1],
    [0, 0, -1]
  ].flat()

  // https://github.com/byWulf/threejs-dice/blob/master/lib/dice.js#L499
  for (let i = 0; i < sides; ++i) {
    const b = (i * Math.PI * 2) / sides
    vertices.push(-Math.cos(b), -Math.sin(b), 0.105 * (i % 2 ? 1 : -1))
  }

  const faces = [
    [0, 11, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
    [0, 5, 6],
    [0, 6, 7],
    [0, 7, 8],
    [0, 8, 9],
    [0, 9, 10],
    [0, 10, 11],
    [1, 3, 2],
    [1, 4, 3],
    [1, 5, 4],
    [1, 6, 5],
    [1, 7, 6],
    [1, 8, 7],
    [1, 9, 8],
    [1, 10, 9],
    [1, 11, 10],
    [1, 2, 11]
  ].flat()
  const args = [vertices, faces, radius, 0]
  const pentagonalTrapezohedronGeometry = new THREE.PolyhedronGeometry(...args)
  const [ref, api] = useConvexPolyhedron(() => {
    return {
      args: pentagonalTrapezohedronGeometry,
      mass: 1,
      ...props
    }
  })

  // Defining groups allows us to use a material array for BufferGeometry
  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < sides; i++) {
        ref.current.geometry.addGroup(i * verticesPerFace, verticesPerFace, i)
      }
      console.log(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Polyhedron args={args} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {/* TODO What's causing text textures to appear stretched? Is the UV map messed up? */}
      {/* {Array.from(Array(sides)).map((_, i) => (
        <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
      ))} */}
      <meshPhongMaterial attachArray="material" color="grey" />
      <meshPhongMaterial attachArray="material" color="white" />
      <meshPhongMaterial attachArray="material" color="brown" />
      <meshPhongMaterial attachArray="material" color="black" />
      <meshPhongMaterial attachArray="material" color="azure" />
      <meshPhongMaterial attachArray="material" color="beige" />
      <meshPhongMaterial attachArray="material" color="cornflowerblue" />
      <meshPhongMaterial attachArray="material" color="maroon" />
      <meshPhongMaterial attachArray="material" color="darkgreen" />
      <meshPhongMaterial attachArray="material" color="darkblue" />
    </Polyhedron>
  )
}

const D12 = (props) => {
  const sides = 12
  const verticesPerFace = 9 // A pentagon is made of 3 triangles
  const radius = 2
  const dodecahedronGeometry = new THREE.DodecahedronGeometry(radius)
  const [ref, api] = useConvexPolyhedron(() => {
    return {
      args: dodecahedronGeometry,
      mass: 1,
      ...props
    }
  })

  // Defining groups allows us to use a material array for BufferGeometry
  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < sides; i++) {
        ref.current.geometry.addGroup(i * verticesPerFace, verticesPerFace, i)
      }
      console.log(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dodecahedron args={radius} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {/* TODO What's causing text textures to appear stretched? Is the UV map messed up? */}
      {/* {Array.from(Array(sides)).map((_, i) => (
        <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
      ))} */}
      <meshPhongMaterial attachArray="material" color="grey" />
      <meshPhongMaterial attachArray="material" color="white" />
      <meshPhongMaterial attachArray="material" color="brown" />
      <meshPhongMaterial attachArray="material" color="black" />
      <meshPhongMaterial attachArray="material" color="azure" />
      <meshPhongMaterial attachArray="material" color="beige" />
      <meshPhongMaterial attachArray="material" color="cornflowerblue" />
      <meshPhongMaterial attachArray="material" color="maroon" />
      <meshPhongMaterial attachArray="material" color="darkgreen" />
      <meshPhongMaterial attachArray="material" color="darkblue" />
      <meshPhongMaterial attachArray="material" color="yellow" />
      <meshPhongMaterial attachArray="material" color="darkgoldenrod" />
    </Dodecahedron>
  )
}

const D20 = (props) => {
  const sides = 20
  const verticesPerFace = 3
  const radius = 2
  const icosahedronGeometry = new THREE.IcosahedronGeometry(radius)
  const [ref, api] = useConvexPolyhedron(() => {
    return {
      args: icosahedronGeometry,
      mass: 1,
      ...props
    }
  })

  // Defining groups allows us to use a material array for BufferGeometry
  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < sides; i++) {
        ref.current.geometry.addGroup(i * verticesPerFace, verticesPerFace, i)
      }
      console.log(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Icosahedron args={radius} ref={ref} onClick={() => api.applyImpulse([0, 20, 0], [0, 0, 0])} castShadow receiveShadow>
      {/* TODO What's causing text textures to appear stretched? Is the UV map messed up? */}
      {/* {Array.from(Array(sides)).map((_, i) => (
        <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
      ))} */}
      <meshPhongMaterial attachArray="material" color="grey" />
      <meshPhongMaterial attachArray="material" color="white" />
      <meshPhongMaterial attachArray="material" color="brown" />
      <meshPhongMaterial attachArray="material" color="black" />
      <meshPhongMaterial attachArray="material" color="azure" />
      <meshPhongMaterial attachArray="material" color="beige" />
      <meshPhongMaterial attachArray="material" color="cornflowerblue" />
      <meshPhongMaterial attachArray="material" color="maroon" />
      <meshPhongMaterial attachArray="material" color="darkgreen" />
      <meshPhongMaterial attachArray="material" color="darkblue" />
      <meshPhongMaterial attachArray="material" color="yellow" />
      <meshPhongMaterial attachArray="material" color="darkgoldenrod" />
      <meshPhongMaterial attachArray="material" color="darkcyan" />
      <meshPhongMaterial attachArray="material" color="darkorange" />
      <meshPhongMaterial attachArray="material" color="darkorchid" />
      <meshPhongMaterial attachArray="material" color="darksalmon" />
      <meshPhongMaterial attachArray="material" color="darkturquoise" />
      <meshPhongMaterial attachArray="material" color="lightseagreen" />
      <meshPhongMaterial attachArray="material" color="magenta" />
      <meshPhongMaterial attachArray="material" color="navy" />
    </Icosahedron>
  )
}

ReactDOM.render(
  <Canvas concurrent shadowMap sRGB gl={{ alpha: false }} camera={{ position: [0, -12, 16] }}>
    <hemisphereLight intensity={0.35} />
    <spotLight position={[30, 0, 30]} angle={0.3} penumbra={1} intensity={2} castShadow shadow-mapSize-width={256} shadow-mapSize-height={256} />
    <pointLight position={[-30, 0, -30]} intensity={0.5} />
    <Physics gravity={[0, 0, -30]}>
      <Plane color={niceColors[17][4]} />
      <Plane color={niceColors[17][1]} position={[-10, 0, 0]} rotation={[0, 1, 0]} />
      <Plane color={niceColors[17][2]} position={[10, 0, 0]} rotation={[0, -1, 0]} />
      <Plane color={niceColors[17][3]} position={[0, 10, 0]} rotation={[1, 0, 0]} />
      <Plane color={niceColors[17][0]} position={[0, -10, 0]} rotation={[-1, 0, 0]} />
      <D4 position={[-4, 0, 2]} rotation={[0, 1, 0]} />
      <D6 position={[0, 0, 2]} />
      <D8 position={[0, 4, 2]} rotation={[1, 1, 0]} />
      <D10 position={[-4, -4, 2]} rotation={[0, 1, 0]} />
      <D10 position={[4, -4, 2]} rotation={[0.5, -1, 0]} />
      <D12 position={[0, -4, 2]} rotation={[1, 0, 0]} />
      <D20 position={[4, 0, 2]} rotation={[2, 0, 0]} />
    </Physics>
  </Canvas>,
  document.getElementById('root')
)
