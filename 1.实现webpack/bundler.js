/*
 * @Author: Quinn
 * @Date: 2021-03-30 16:17:32
 * @LastEditTime: 2021-03-30 17:07:01
 * @LastEditors: quinn
 * @Description:  
 */
/*
1、利用babel完成代码转换,并生成单个文件的依赖
2、生成依赖图谱
3、生成最后打包代码 
*/

//导入包
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')

/* 第一步:转换代码、 生成依赖
转换代码需要利用@babel/parser生成AST抽象语法树，然后利用@babel/traverse进行AST遍历，
记录依赖关系，最后通过@babel/core和@babel/preset-env进行代码的转换 */

function stepOne(filename) {
    //读入文件
    const content = fs.readFileSync(filename, 'utf-8')
    const ast = parser.parse(content, {
        //babel官方规定必须加这个参数，不然无法识别ES Module
        sourceType: 'module'
    })
    const dependencies = {}
    //遍历AST抽象语法树
    traverse(ast, {
        //获取通过import引入的模块
        ImportDeclaration({
            node
        }) {
            const dirname = path.dirname(filename)
            const newFile = './' + path.join(dirname, node.source.value)
            //保存所依赖的模块
            dependencies[node.source.value] = newFile
        }
    })
    //通过@babel/core和@babel/preset-env进行代码的转换
    const {
        code
    } = babel.transformFromAst(ast, null, {
        presets: ["@babel/preset-env"]
    })
    return {
        filename, //该文件名
        dependencies, //该文件所依赖的模块集合(键值对存储)
        code //转换后的代码
    }
}

// 第二步：生成依赖图谱
//entry为入口文件
function stepTwo(entry) {
    const entryModule = stepOne(entry)
    //这个数组是核心，虽然现在只有一个元素，往后看你就会明白
    const graphArray = [entryModule]
    for (let i = 0; i < graphArray.length; i++) {
        const item = graphArray[i];
        const {
            dependencies
        } = item; //拿到文件所依赖的模块集合(键值对存储)
        for (let j in dependencies) {
            graphArray.push(
                stepOne(dependencies[j])
            ) //敲黑板！关键代码，目的是将入口模块及其所有相关的模块放入数组
        }
    }
    //接下来生成图谱
    const graph = {}
    graphArray.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    })
    return graph
}

// 第三步: 生成代码字符串
//下面是生成代码字符串的操作，仔细看，不要眨眼睛哦！
function stepThree(entry) {
    //要先把对象转换为字符串，不然在下面的模板字符串中会默认调取对象的toString方法，参数变成[Object object],显然不行
    const graph = JSON.stringify(stepTwo(entry))
    return `(function(graph) {
            //require函数的本质是执行一个模块的代码，然后将相应变量挂载到exports对象上
            function require(module) {
                //localRequire的本质是拿到依赖包的exports变量
                function localRequire(relativePath) {
                    return require(graph[module].dependencies[relativePath]);
                }
                var exports = {};
                (function(require, exports, code) {
                    eval(code);
                })(localRequire, exports, graph[module].code);
                return exports;//函数返回指向局部变量，形成闭包，exports变量在函数执行后不会被摧毁
            }
            require('${entry}')
        })(${graph})`
}

//最终测试

fs.readdir(path.resolve(__dirname, './'), function (error, data) {
    if (error) {
        console.log(error);
        return false;
    }
    let flag = data.indexOf('dist') != -1;
    // 存在dist
    if (flag) {
        fs.writeFile('./dist/bundle.js', stepThree('./src/index.js'), function (err) {
            if (err) {
                return console.error(err);
            }
            console.log("成功！");
        });
    } else {
        fs.mkdir('dist', function (error) {
            if (error) {
                console.log(error);
                return false;
            }
            fs.writeFile(`./dist/bundle.${Date.now()}.js`, stepThree('./src/index.js'), function (err) {
                if (err) {
                    return console.error(err);
                }
                console.log("成功！");
            });
        })
    }
})