
window.addEventListener('load',function (){
    const canvas = document.querySelector("#canvas1")
    const ctx = canvas.getContext('2d')
    canvas.width=1000
    canvas.height=500

//класс игры
    class Game
    {
        constructor(width,height) {
            this.width= width
            this.heigth=height
            this.groundMargin=80
            this.speed=0
            this.maxSpeed=2
            this.background=new Background(this)
            this.player=new Player(this)
            this.input=new InputHandler(this)
            this.UI=new UI(this)
            this.enemies=[]
            this.enemyTimer=0
            this.enemyUnterval=1000
            this.debug=true
            this.score=0
            this.fontColor='black'
        }
        update(delTime)
        {
            this.background.update()
            this.player.update(this.input.keys,delTime)
            if(this.enemyTimer>this.enemyUnterval)
            {
                this.addEnemy()
                this.enemyTimer=0
            } else this.enemyTimer+=delTime
            this.enemies.forEach(enemy=>{
                enemy.update(delTime)
                if(enemy.markedForDeletion) this.enemies.splice(this.enemies.indexOf(enemy),1)
            })

        }
        draw(context)
        {
            this.background.draw(context)
            this.player.draw(context)
            this.enemies.forEach(enemy=>{
                enemy.draw(context)
            })
            this.UI.draw(context)
        }
        addEnemy()
        {
            if(this.speed>0 && Math.random()<0.5) this.enemies.push(new GroundEnemy(this))
            else if(this.speed>0) this.enemies.push(new ClimbingEnemy(this))
            this.enemies.push(new FlyingEnemy(this))
        }
    }
//класс игрока
    class Player
    {
        constructor(game)
        {
            this.game=game
            this.width=100
            this.height=91.3
            this.x=0
            this.y=this.game.heigth - this.height - this.game.groundMargin
            this.image = document.querySelector('#player')
            this.speed = 0
            this.maxSpeed=5
            this.vy=0
            this.wait=0.5
            this.states=[new Sitting(this),new Running(this),new Jumping(this),new Falling(this),new Rolling(this)]
            this.currentState=this.states[0]
            this.currentState.enter()
            this.frameX =0
            this.frameY =0
            this.maxFrame = 5
            this.fps = 20
            this.frameInterval = 1000/this.fps
            this.frameTimer = 0
        }
        update(input,delTime)
        {
            this.checkCollision()
            this.currentState.handleInput(input)
            //horizontal
            this.x+=this.speed
            if(input.includes('ArrowRight'))
            {
                this.speed = this.maxSpeed
            }
            else if(input.includes('ArrowLeft'))
            {
                this.speed = -this.maxSpeed
            }
            else this.speed=0
            if(this.x<0) this.x=0
            if(this.x>this.game.width-this.width) this.x=this.game.width-this.width
            //vertical
            this.y+=this.vy
            if(!this.onGround()) this.vy+=this.wait
            else this.vy=0
            //анимация
            if(this.frameTimer>this.frameInterval)
            {
                this.frameTimer=0
                if(this.frameX<this.maxFrame) this.frameX++
                else this.frameX=0

            }else
            {
                this.frameTimer+=delTime
            }


        }
        draw(context)
        {
            if(this.game.debug) context.strokeRect(this.x,this.y,this.width,this.height)
            context.drawImage(this.image,this.frameX*this.width,this.frameY*this.height,this.width,this.height,this.x,this.y,this.width,this.height)
        }
        onGround()
        {
            return this.y>=this.game.heigth - this.height - this.game.groundMargin
        }
        setState(state,speed)
        {
            this.currentState = this.states[state]
            this.game.speed=speed* this.game.maxSpeed
            this.currentState.enter()
        }
        checkCollision()
        {
            this.game.enemies.forEach(enemy=>{
                if(enemy.x<this.x+this.width && enemy.x+enemy.width>this.x && enemy.y<this.y+this.height && enemy.y+enemy.height>this.y)
                {
                    enemy.markedForDeletion=true
                    this.game.score++
                }

            })
        }
    }
    class InputHandler
    {
        constructor(game)
        {
            this.game=game
            this.keys=[]
            window.addEventListener('keydown',e=>{
                if((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control' || e.key==='1') && this.keys.indexOf(e.key) === -1)
                {
                    this.keys.push(e.key)
                }else if(e.key==='d') this.game.debug=!this.game.debug
            })

            window.addEventListener('keyup',e=>{
                if(e.key === 'ArrowDown' || e.key === 'ArrowUp'  || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control' || e.key === '1')
                {
                    this.keys.splice(this.keys.indexOf(e.key),1)
                }

            })

        }
    }
//класс состояния игрока
    const states = {
        SITTING:0,
        RUNNING:1,
        JUMPING:2,
        FALLING:3,
        ROLLING:4,
        DIVING:5,
        HIT:6,
    }
    class State {
        constructor(state)
        {
            this.state = state
        }
    }
//состояния персонажа сидеть
    class Sitting extends State{
        constructor(player) {
            super('SITTING');
            this.player = player
        }
        enter(){
            this.player.frameX=0
            this.player.maxFrame=4
            this.player.frameY=5
        }
        handleInput(input){
            if(input.includes('ArrowLeft') || input.includes('ArrowRight'))
            {
                this.player.setState(states.RUNNING,1)
            } else if(input.includes('1')) this.player.setState(states.ROLLING,2)
        }
    }
    //состояния персонажа бежать
    class Running extends State{
        constructor(player) {
            super('RUNNING');
            this.player = player
        }
        enter(){
            this.player.frameX=0
            this.player.maxFrame=6
            this.player.frameY=3
        }
        handleInput(input){
            if(input.includes('ArrowDown'))
            {
                this.player.setState(states.SITTING,0)
            } else if(input.includes('ArrowUp'))
            {
                this.player.setState(states.JUMPING,1)
            } else if(input.includes('1')) this.player.setState(states.ROLLING,2)
        }
    }
    //состояния персонажа прыжок
    class Jumping extends State{
        constructor(player) {
            super('JUMPING');
            this.player = player
        }
        enter(){
            if(this.player.onGround()) this.player.vy-=20
            this.player.frameX=0
            this.player.maxFrame=6
            this.player.frameY=1
        }
        handleInput(input){
            if(this.player.vy > this.player.wait)
            {
                this.player.setState(states.FALLING,1)
            } else if(input.includes('1')) this.player.setState(states.ROLLING,2)
        }
    }
    //состояния персонажа падение
    class Falling extends State{
        constructor(player) {
            super('FALLING');
            this.player = player
        }
        enter(){
            this.player.frameX=0
            this.player.maxFrame=6
            this.player.frameY=2
        }
        handleInput(input){
            if(this.player.onGround())
            {
                this.player.setState(states.RUNNING,1)
            }
        }
    }
    class Rolling extends State{
        constructor(player) {
            super('ROLLING');
            this.player = player
        }
        enter(){
            this.player.frameX=0
            this.player.maxFrame=6
            this.player.frameY=6
        }
        handleInput(input){
            if(!input.includes('1') && this.player.onGround())
            {
                this.player.setState(states.RUNNING,1)
            } else if(!input.includes('1') && !this.player.onGround())
            {
                this.player.setState(states.FALLING, 1)
            }else if(input.includes('1') && input.includes('ArrowUp') && this.player.onGround())
            {
                this.player.vy-=20
            }

        }
    }

    class Particle {
        constructor(game) {
            this.game=game
            this.matkedForDeletion=false
        }
        update()
        {
            this.x-=this.speedX+this.speed
            this.y-=this.speedY
            this.size*=0.95
            if(this.size<0.5) this.matkedForDeletion=true
        }
    }



    //паралакс фон
    class Layer {
        constructor(game,width,height,speedMod,image) {
            this.game=game
            this.width=width
            this.height=height
            this.speedMod=speedMod
            this.image=image
            this.x=0
            this.y=0
        }
        update()
        {
            if(this.x<-this.width) this.x=0
            else this.x-=this.game.speed*this.speedMod
        }
        draw(context)
        {
            context.drawImage(this.image,this.x,this.y,this.width,this.height)
            context.drawImage(this.image,this.x+this.width,this.y,this.width,this.height)
        }
    }
    class Background {
        constructor(game) {
            this.game=game
            this.width=1667
            this.height=500
            this.layer5image=document.querySelector('#layer5')
            this.layer1image=document.querySelector('#layer1')
            this.layer2image=document.querySelector('#layer2')
            this.layer3image=document.querySelector('#layer3')
            this.layer4image=document.querySelector('#layer4')
            this.layer1=new Layer(this.game,this.width,this.height,0,this.layer1image)
            this.layer2=new Layer(this.game,this.width,this.height,0.2,this.layer2image)
            this.layer3=new Layer(this.game,this.width,this.height,0.4,this.layer3image)
            this.layer4=new Layer(this.game,this.width,this.height,0.8,this.layer4image)
            this.layer5=new Layer(this.game,this.width,this.height,1,this.layer5image)
            this.backgroundLayers= [this.layer1,this.layer2,this.layer3,this.layer4,this.layer5]
        }
        update()
        {
            this.backgroundLayers.forEach(layer=>{
                layer.update()
            })
        }
        draw(context)
        {
            this.backgroundLayers.forEach(layer=>{
                layer.draw(context)
            })
        }
    }
//мобы
    class Enemy {
        constructor() {
            this.frameX=0
            this.frameY=0
            this.fps=20
            this.frameInterval=1000/this.fps
            this.frameTimer=0
            this.markedForDeletion=false
        }
        update(deltaTime)
        {
            this.x-=this.speedX + this.game.speed
            this.y+=this.speedY
            if(this.frameTimer>this.frameInterval)
            {
                this.frameTimer=0
                if(this.frameX<this.maxFrame) this.frameX++
                else this.frameX=0
            }else this.frameTimer+=deltaTime

            if(this.x+this.width<0) this.markedForDeletion=true

        }
        draw(context)
        {
            if(this.game.debug) context.strokeRect(this.x,this.y,this.width,this.height)
            context.drawImage(this.image,this.frameX*this.width,0,this.width,this.height,this.x,this.y,this.width,this.height)
        }
    }

    class FlyingEnemy extends Enemy{
        constructor(game) {
            super();
            this.game=game
            this.width=60
            this.height=44
            this.x=this.game.width+Math.random()*this.game.width*0.5
            this.y=Math.random()*this.game.heigth*0.5
            this.speedX=Math.random()+1
            this.speedY=0
            this.maxFrame=5
            this.image=document.querySelector('#Enemy_fly')
            this.angle=0
            this.va=Math.random()*0.1+0.1
        }
        update(deltaTime) {
            super.update(deltaTime);
            this.angle+=this.va
            this.y+=Math.sin(this.angle)
        }
    }
    class GroundEnemy extends Enemy{
        constructor(game) {
            super();
            this.game=game
            this.width=60
            this.height=87
            this.x=this.game.width
            this.y=this.game.heigth-this.height-this.game.groundMargin
            this.image=document.querySelector('#Enemy_plant')
            this.speedX=0
            this.speedY=0
            this.maxFrame=1

        }
    }
    class ClimbingEnemy extends Enemy{
        constructor(game) {
            super();
            this.game=game
            this.width=120
            this.height=144
            this.x=this.game.width
            this.y=Math.random()*this.height*0.5
            this.image=document.querySelector('#Enemy_spider')
            this.speedX=0
            this.speedY=Math.random()>0.5?1:-1
            this.maxFrame=5
        }
        update(deltaTime) {
            super.update(deltaTime);
            if(this.y>this.game.heigth-this.height-this.game.groundMargin) this.speedY*=-1
            if(this.y<-this.height) this.markedForDeletion=true
        }
        draw(context) {
            super.draw(context);
            context.beginPath()
            context.moveTo(this.x+this.width/2,0)
            context.lineTo(this.x+this.width/2,this.y+50)
            context.stroke()

        }
    }
    class UI {
        constructor(game) {
            this.game=game
            this.fontSize=30
            this.fontFamily='Helvetica'
        }
        draw(context)
        {
            context.font=this.fontSize+'px '+this.fontFamily
            context.textAlign='left'
            context.fillStyle=this.game.fontColor
            context.fillText('Score: '+this.game.score,20,50)
        }
    }


//обновление сцены 60фпс
    const game = new Game(canvas.width,canvas.height)
    console.log(game)
    let lastTime =0
    function animate(timeStamp)
    {
        const delTime = timeStamp - lastTime
        lastTime=timeStamp
        ctx.clearRect(0,0,canvas.width,canvas.height)
        game.update(delTime)
        game.draw(ctx)
        requestAnimationFrame(animate)
    }
    animate(0)
})
