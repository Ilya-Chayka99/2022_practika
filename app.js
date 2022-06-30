
window.addEventListener('load',function (){
    const canvas = document.querySelector("#canvas1")
    const ctx = canvas.getContext('2d')
    let currLevel=2
    canvas.width=1000
    canvas.height=500

//класс игры
    class Game
    {
        constructor(width,height) {
            this.width= width
            this.heigth=height
            this.groundMargin=60
            this.speed=0
            this.maxSpeed=2
            this.background=new Background(this)
            this.player=new Player(this)
            this.input=new InputHandler(this)
            this.UI=new UI(this)
            this.collisions=[]
            this.enemies=[]
            this.particles=[]
            this.enemyTimer=0
            this.enemyUnterval=1000
            this.debug=false
            this.score=0
            this.fontColor='black'
            this.player.currentState=this.player.states[0]
            this.player.currentState.enter()
            this.gameOver=false
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
            this.particles.forEach((particle,i)=>{
                if(particle.matkedForDeletion) this.particles.splice(i,1)
                particle.update()
            })
            if(this.particles.length>500) this.particles=this.particles.splice(0,500)
            this.collisions.forEach((col,i)=>{
                col.update(delTime)
                if(col.matkedForDeletion) this.collisions.splice(i,1)
            })

        }
        draw(context)
        {
            this.background.draw(context)
            this.player.draw(context)
            this.enemies.forEach(enemy=>{
                enemy.draw(context)
            })
            this.particles.forEach(particle=>{
                particle.draw(context)
            })
            this.collisions.forEach(coll=>{
                coll.draw(context)
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
            this.width=55.56
            this.height=100
            this.x=0
            this.y=this.game.heigth - this.height - this.game.groundMargin
            this.image = document.querySelector('#player')
            this.speed = 0
            this.maxSpeed=5
            this.vy=0
            this.wait=0.5
            this.states=[new Sitting(this.game),new Running(this.game),new Jumping(this.game),new Falling(this.game),
                new Rolling(this.game),new Diving(this.game),new Hit(this.game)]
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
            if(this.y>this.game.heigth-this.height-this.game.groundMargin) this.y=this.game.heigth-this.height-this.game.groundMargin
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
                    this.game.collisions.push(new CollisionAnimation(this.game,enemy.x+enemy.width*0.5,enemy.y+enemy.height*0.5))
                    if (this.currentState===this.states[4]||this.currentState===this.states[5])
                        this.game.score++
                    else this.setState(6,0)
                    if(this.game.score>=10)
                    {
                        this.game.gameOver=true
                    }
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
                if((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control' || e.key==='w' || e.key==='ц') && this.keys.indexOf(e.key) === -1)
                {
                    this.keys.push(e.key)
                }else if(e.key==='d') this.game.debug=!this.game.debug
            })

            window.addEventListener('keyup',e=>{
                if(e.key === 'ArrowDown' || e.key === 'ArrowUp'  || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control' || e.key === 'w' || e.key==='ц')
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
        constructor(state,game)
        {
            this.state = state
            this.game=game
        }
    }
//состояния персонажа сидеть
    class Sitting extends State{
        constructor(game) {
            super('SITTING',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=11
            this.game.player.frameY=0
        }
        handleInput(input){
            if(input.includes('ArrowLeft') || input.includes('ArrowRight'))
            {
                this.game.player.setState(states.RUNNING,1)
            } else if(input.includes('w')||input.includes('ц')) this.game.player.setState(states.ROLLING,2)
        }
    }
    //состояния персонажа бежать
    class Running extends State{
        constructor(game) {
            super('RUNNING',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=11
            this.game.player.frameY=0
        }
        handleInput(input){
            this.game.particles.push(new Dust(this.game,this.game.player.x+this.game.player.width*0.5,this.game.player.y+this.game.player.height))
            if(input.includes('ArrowDown'))
            {
                this.game.player.setState(states.SITTING,0)
            } else if(input.includes('ArrowUp'))
            {
                this.game.player.setState(states.JUMPING,1)
            } else if(input.includes('w')||input.includes('ц')) this.game.player.setState(states.ROLLING,2)
        }
    }
    //состояния персонажа прыжок
    class Jumping extends State{
        constructor(game) {
            super('JUMPING',game);
        }
        enter(){
            if(this.game.player.onGround()) this.game.player.vy-=20
            this.game.player.frameX=0
            this.game.player.maxFrame=7
            this.game.player.frameY=2
        }
        handleInput(input){
            if(this.game.player.vy > this.game.player.wait)
            {
                this.game.player.setState(states.FALLING,1)
            } else if(input.includes('w')||input.includes('ц')) this.game.player.setState(states.ROLLING,2)
            else if(input.includes('ArrowDown')) this.game.player.setState(states.DIVING,0)
        }
    }
    //состояния персонажа падение
    class Falling extends State{
        constructor(game) {
            super('FALLING',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=4
            this.game.player.frameY=3
        }
        handleInput(input){
            if(this.game.player.onGround())
            {
                this.game.player.setState(states.RUNNING,1)
            } else if(input.includes('ArrowDown')) this.game.player.setState(states.DIVING,0)
        }
    }
    class Rolling extends State{
        constructor(game) {
            super('ROLLING',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=10
            this.game.player.frameY=4
        }
        handleInput(input){
            this.game.particles.push(new Fire(this.game,this.game.player.x+this.game.player.width*0.6,this.game.player.y+this.game.player.height*0.25))

            if(!(input.includes('w') ||input.includes('ц')) && this.game.player.onGround())
            {
                this.game.player.setState(states.RUNNING,1)
            } else if(!(input.includes('w') ||input.includes('ц')) && !this.game.player.onGround())
            {
                this.game.player.setState(states.FALLING, 1)
            }else if((input.includes('w') ||input.includes('ц')) && input.includes('ArrowUp') && this.game.player.onGround())
            {
                this.game.player.vy-=20
            }  else if(input.includes('ArrowDown')&&!this.game.player.onGround()) this.game.player.setState(states.DIVING,0)

        }
    }

    class Diving extends State{
        constructor(game) {
            super('DIVING',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=6
            this.game.player.frameY=6
            this.game.player.vy=15
        }
        handleInput(input){
            this.game.particles.push(new Fire(this.game,this.game.player.x+this.game.player.width*0.5,this.game.player.y+this.game.player.height*0.5))

            if(this.game.player.onGround())
            {
                this.game.player.setState(states.RUNNING,1)
                for(let i=0;i<30;i++)
                this.game.particles.push(new Splash(this.game,this.game.player.x+this.game.player.width*0.5,this.game.player.y+this.game.player.height))
            } else if((input.includes('w') ||input.includes('ц'))&& this.game.player.onGround())
            {
                this.game.player.setState(states.ROLLING, 2)
            }

        }
    }

    class Hit extends State{
        constructor(game) {
            super('HIT',game);
        }
        enter(){
            this.game.player.frameX=0
            this.game.player.maxFrame=11
            this.game.player.frameY=1
        }
        handleInput(input){
            if(this.game.player.frameX>=10 && this.game.player.onGround())
            {
                this.game.player.setState(states.RUNNING,1)
            } else if(this.game.player.frameX>=10 && !this.game.player.onGround())
            {
                this.game.player.setState(states.FALLING, 1)
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
            this.x-=this.speedX+this.game.speed
            this.y-=this.speedY
            this.size*=0.95
            if(this.size<0.5) this.matkedForDeletion=true
        }
    }
    class Dust extends Particle{
        constructor(game,x,y) {
            super(game);
            this.size=Math.random()*10+10
            this.x=x
            this.y=y
            this.speedX=Math.random()
            this.speedY=Math.random()
            this.color='rgba(0,0,0,0.2)'

        }
        draw(context)
        {
            context.beginPath()
            context.arc(this.x,this.y,this.size,0,Math.PI*2)
            context.fillStyle=this.color
            context.fill()
        }
    }
    class Splash extends Particle{
        constructor(game,x,y) {
            super(game);
            this.size=Math.random()*100+100
            this.x=x-this.size*0.4
            this.y=y-this.size*0.5
            this.speedX=Math.random()*6-4
            this.speedY=Math.random()*2+2
            this.gravity=0
            this.image=document.querySelector('#fire')
        }
        update() {
            super.update();
            this.gravity+=0.1
            this.y+=this.gravity
        }
        draw(context)
        {
            context.drawImage(this.image,this.x,this.y,this.size,this.size)
        }
    }
    class Fire extends Particle{
        constructor(game,x,y) {
            super(game);
            this.image=document.querySelector('#fire')
            this.size=Math.random()*100+50
            this.y=y
            this.x=x
            this.speedX=1
            this.speedY=1
            this.angle=0
            this.va=Math.random()*0.5-0.2

        }
        update() {
            super.update();
            this.angle+=this.va
            this.x+=Math.sin(this.angle*5)
        }
        draw(context)
        {
            context.save()
            context.translate(this.x,this.y)
            context.rotate(this.angle)
            context.drawImage(this.image,-this.size*0.5,-this.size*0.5,this.size,this.size)
            context.restore()
        }
    }
    class CollisionAnimation {
        constructor(game,x,y) {
            this.game=game
            this.image=document.querySelector('#boom')
            this.swidth=100
            this.sheight=90
            this.sizeMod=Math.random()+0.5
            this.width=this.swidth* this.sizeMod
            this.height=this.sheight* this.sizeMod
            this.x=x-this.width*0.5
            this.y=y-this.height*0.5
            this.frameX=0
            this.maxFrame=4
            this.markedForDeletion=false
            this.fps=15
            this.frameInterval=1000/this.fps
            this.frameTimer=0
        }
        update(deltaTime)
        {
            this.x-=this.game.speed
            if(this.frameTimer>this.frameInterval)
            {
                this.frameX++
                this.frameTimer=0
            }else this.frameTimer+=deltaTime
            if(this.frameX>this.maxFrame) this.markedForDeletion=true

        }
        draw(context)
        {
            context.drawImage(this.image,this.frameX*this.swidth,0,this.sheight,this.sheight,this.x,this.y,this.width,this.height)
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
            this.fontFamily='minecraft'
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
    let game = new Game(canvas.width,canvas.height)
    let lastTime =0
    function animate(timeStamp)
    {
        const delTime = timeStamp - lastTime
        lastTime=timeStamp
        ctx.clearRect(0,0,canvas.width,canvas.height)
        game.update(delTime)
        game.draw(ctx)
        if(!game.gameOver)requestAnimationFrame(animate)
        else
        {
            currLevel++;
            document.querySelector('.Ui').style.display='block'
            curLevelProw()
        }
    }

    function curLevelProw()
    {
        document.querySelectorAll('.levelBlock').forEach(ell=>{
            let num=ell.innerHTML
            if(currLevel>=num)
            {
                let table = document.querySelectorAll('.level')
                table[num-1].classList.replace('Lock',"number")
                table[num-1].setAttribute('src',`img/UI/${num}.png`)
                game=new Game(canvas.width,canvas.height)
            }
        })

    }

    document.querySelector('#Play').addEventListener('click',(e)=>{
        document.querySelector('#Play').style.display='none'
        document.querySelector('.NameGame').style.display='none'
        curLevelProw()
        document.querySelector('#bgLevel').style.display='block'
        document.querySelector('.upgrade').style.display='block'
    })

    document.querySelectorAll('.levelBlock').forEach(e=>{
        e.addEventListener('click',el=>{
            let num=e.innerHTML
            if(currLevel>=num)
            {
                document.querySelector('.Ui').style.display='none'
                document.querySelector('#layer1').setAttribute('src',`img/level-${num}/layer-1${num}.png`)
                document.querySelector('#layer2').setAttribute('src',`img/level-${num}/layer-2${num}.png`)
                document.querySelector('#layer3').setAttribute('src',`img/level-${num}/layer-3${num}.png`)
                document.querySelector('#layer4').setAttribute('src',`img/level-${num}/layer-4${num}.png`)
                document.querySelector('#layer5').setAttribute('src',`img/level-${num}/layer-5${num}.png`)
                game=new Game(canvas.width,canvas.height)
                animate(1)
            }
        })
    })

    document.querySelector('.upgrade').addEventListener('click',()=>{
        document.querySelector('#table').style.display='none'
        document.querySelector('#tableUpgrade').style.display='block'
        document.querySelector('.spell').style.display='block'
        document.querySelector('#levelSelect').setAttribute('src','img/UI/header2.png')
    })
})
