import * as THREE from '../../../../lib/threejs/src/Three.js';

export default class Ball extends THREE.EventDispatcher {
  constructor(radius = 1) {
    super();

    this.newPosX = 0;
    this.newPosY = 0;
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 'white' });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);

    // if (isNaN(radius) || radius <= 0) {
    //   console.warn('Invalid radius provided. Setting to default value of 1.');
    //   radius = 1;
    // }
    
    
    // this.originalSpeed = baseSpeed;
    // this.maxSpeed = 3;
    // // Imposta la velocità base e la direzione
    // this.baseSpeed = baseSpeed;
    // this.direction = new THREE.Vector3(
    //   Math.random() > 0.5 ? 1 : -1, 
    //   Math.random() > 0.5 ? 1 : -1, 
    //   0
    // ).normalize();
    
    // // Inizializza la velocità basandosi sulla direzione e la velocità di base
    // this.velocity = this.direction.clone().multiplyScalar(baseSpeed);

    // // Memorizza i paddle e i confini
    // this.paddles = paddles;
    // this.bounds = bounds; // Limiti del campo di gioco  

    // this.soundBounce = sounds.bounce;
    // this.soundPaddle = sounds.paddleBounce;
  }

  // resetVelocity() {
  //   // Reimposta la velocità di base all'originale
  //   this.baseSpeed = this.originalSpeed;

  //   // Genera una nuova direzione casuale
  //   const randomYDirection = Math.random() > 0.5 ? 1 : -1; 
  //   const randomAngleFactor = (Math.random() * 0.4) - 0.2; 

  //   // Reimposta la velocità e la direzione della pallina
  //   this.velocity.set(-Math.sign(this.velocity.x), randomYDirection + randomAngleFactor, 0).normalize();
  //   this.velocity.multiplyScalar(this.baseSpeed); 
  // }

  // Metodo per controllare le collisioni con muri e paddle
  // checkCollisions(tPos) 
  // {
    // // Controllo collisione con i muri (Bounds)
    // if (tPos.x - this.mesh.geometry.parameters.radius <= this.bounds.xMin) {
    //   // Collisione con il muro sinistro (goal)
    //   tPos.set(0, 0, 0);
    //   this.dispatchEvent({ type: 'ongoal', message: 'pc' })
    //   this.resetVelocity();
    // } else if (tPos.x + this.mesh.geometry.parameters.radius >= this.bounds.xMax) {
    //   // Collisione con il muro destro (goal)
    //   tPos.set(0, 0, 0);
    //   this.dispatchEvent({ type: 'ongoal', message: 'player' })
    //   this.resetVelocity();
    // }

    // if (tPos.y - this.mesh.geometry.parameters.radius <= this.bounds.yMin) {
    //   // Collisione con il muro inferiore
    //   if(!this.soundBounce.isPlaying)
    //   this.soundBounce.play();  
    //   tPos.y = this.bounds.yMin + this.mesh.geometry.parameters.radius;
    //   this.velocity.y *= -1; // Inverte la velocità sull'asse Y
    // } else if (tPos.y + this.mesh.geometry.parameters.radius >= this.bounds.yMax) {
    //   // Collisione con il muro superiore
    //   if(!this.soundBounce.isPlaying)
    //     this.soundBounce.play();
    //   tPos.y = this.bounds.yMax - this.mesh.geometry.parameters.radius;
    //   this.velocity.y *= -1; // Inverte la velocità sull'asse Y
    // }

    // // Trova il paddle corrispondente per la direzione di movimento
    // const paddle = this.paddles.find(paddle => {
    //   return Math.abs(paddle.mesh.position.x - this.mesh.position.x) < paddle.mesh.geometry.parameters.width / 2;
    // });

    // if (paddle) {
    //   const paddleBoundingBox = new THREE.Box3().setFromObject(paddle.mesh);
      
    //   // Crea una bounding box più grande per intercettare il movimento rapido
    //   const expandedPaddleBox = paddleBoundingBox.clone();
    //   expandedPaddleBox.expandByScalar(this.mesh.geometry.parameters.radius * 0.01);

    //   // Controllo collisione lungo il tragitto della pallina
    //   if (expandedPaddleBox.intersectsSphere(new THREE.Sphere(tPos, this.mesh.geometry.parameters.radius))) {
    //     // Rilevazione precisa con interpolazione
    //     this.soundPaddle.play();

    //     const impactPointY = this.mesh.position.y - paddle.mesh.position.y;
    //     const paddleHeight = paddle.mesh.geometry.parameters.height;

    //     // Aggiungi un effetto direzionale basato sull'impatto Y
    //     const impactFactor = (impactPointY / (paddleHeight / 2)); // Valore tra -1 e 1

    //     // Riflessione normale con inclinazione basata sull'impatto
    //     const normal = new THREE.Vector3(-Math.sign(this.velocity.x), impactFactor * 0.5, 0).normalize();
    //     this.velocity.reflect(normal);

    //     // Limita l'inclinazione verticale per evitare che diventi troppo verticale
    //     const maxVerticalFactor = 0.6; // Max rapporto tra velocità y e x
    //     if (Math.abs(this.velocity.y) > Math.abs(this.velocity.x) * maxVerticalFactor) {
    //       this.velocity.y = Math.sign(this.velocity.y) * Math.abs(this.velocity.x) * maxVerticalFactor;
    //     }

    //     // Aumenta leggermente la velocità dopo l'impatto
    //     this.baseSpeed *= 1.05;
    //     this.velocity.normalize().multiplyScalar(this.baseSpeed);

    //     // Correggi la posizione della pallina per evitare che resti bloccata nella paddle
    //     const overlap = this.mesh.geometry.parameters.radius - paddleBoundingBox.min.x + paddle.mesh.position.x;
    //     tPos.x += overlap * Math.sign(this.velocity.x);
    //   }
    // }
  // }

  // Metodo per aggiornare la posizione della pallina in base al deltaTime con sub-stepping
  // update(dt) 
  // {
    // const subSteps = 10;  // Numero di sotto-passaggi
    // const stepDt = dt / subSteps;  // Delta time per ogni sotto-passaggio

    // for (let i = 0; i < subSteps; i++) {
    //   // Esegui il movimento per il sub-step corrente
    //   const s = this.velocity.clone().multiplyScalar(stepDt);
    //   const tPos = this.mesh.position.clone().add(s);

    //   // Controlla le collisioni dopo ogni sub-step
    //   this.checkCollisions(tPos);

    //   // Aggiorna la posizione della pallina
    //   this.mesh.position.copy(tPos);
    // }
  // }
}
