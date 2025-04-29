import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Base
 */
// Debug
const gui = new GUI()
const debugAnimation = {}

debugAnimation.foxWalk = () =>
{
    goTo(walkingAction)
}

debugAnimation.foxRunning = () =>
{
    goTo(runningAction , 2)
}
debugAnimation.foxIdle = () =>
{
    goTo(idleAction)
}  

gui.add(debugAnimation, 'foxWalk',1000 )
gui.add(debugAnimation, 'foxRunning',1000 )
gui.add(debugAnimation, 'foxIdle',1000 )

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let idleAction = null
let walkingAction = null
let runningAction = null
let currentAction = null
let isKeyDown = false
let isWalking = false
let isRunning = false
let movingPos = 0
let foxObject = null
let backwards = false

const goTo = (to, timeScale=1) => {
    if (currentAction) {
        currentAction.crossFadeTo(to, 0.5)
    }
    to.reset()
    to.timeScale = timeScale
    to.play()
    currentAction = to
    
}




const setListeners = () => {
    window.addEventListener("keydown", (ev) => {
        if (ev.key === "w" && !isWalking) {
            goTo(walkingAction)
            movingPos = 0.008;
            isWalking = true
        } else if (ev.key === "Shift" && isWalking && !isRunning) {
            goTo(runningAction, 3)
            movingPos = 0.03;
            isRunning = true 
        } else if (ev.key === "s" && !isWalking && !isRunning) {
            goTo(walkingAction, -1)
            movingPos = - 0.008;
            isWalking = true
            isRunning = false
            backwards = true
        }
    })

    window.addEventListener("keyup", (ev) => {
        

        if (ev.key.toLowerCase() === "w" ||ev.key.toLowerCase() ===  "s") {
            goTo(idleAction)
            isWalking = false
            isRunning = false
            movingPos = 0

        } if (ev.key === "Shift" && isRunning) {
            goTo(walkingAction)
            isRunning = false
            movingPos = 0.005
        }
    })
}
 console.log(goTo)


gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {
        foxObject = gltf.scene
        foxObject.scale.set(0.025, 0.025, 0.025)
        scene.add(foxObject)

        // Animation
        mixer = new THREE.AnimationMixer(foxObject)
        idleAction = mixer.clipAction(gltf.animations[0])
        walkingAction = mixer.clipAction(gltf.animations[1])
        runningAction = mixer.clipAction(gltf.animations[2])
        idleAction.play()
        currentAction = idleAction

        setListeners()
      
    }
)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(- 5, 5, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
    if(mixer)
    {
        mixer.update(deltaTime)
    }

    if (foxObject) {
        foxObject.position.z += movingPos
        console.log(foxObject.position.z)
        if (foxObject.position.z > 4 || foxObject.position.z < -4   )
            movingPos = 0;
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    //setTimeout(tick, 1000)
}

tick()
