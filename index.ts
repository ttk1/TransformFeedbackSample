window.onload = () => {
  const N = 4;
  const array = new Float32Array(N);

  // 値を配列に代入しておく
  for (let i: number = 0; i < N; i++) {
      array[i] = Math.random();
  }

  console.log('処理前:' + array);

  // WebGL 2.0コンテキストを取得する
  const cvs = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = cvs.getContext('webgl2') as WebGL2RenderingContext;

  // Transform Feedbackオブジェクトを取得し、バインドする
  const tf = gl.createTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

  // シェーダプログラムの設定
  function getShader(type: number, source: string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const program = gl.createProgram();
  const vertexShader = getShader(gl.VERTEX_SHADER, require('./glsl/vert.glsl').default);
  gl.attachShader(program, vertexShader);

  const fragmentShader = getShader(gl.FRAGMENT_SHADER, require('./glsl/frag.glsl').default);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // バーテックスシェーダのout変数a_2をTransform Feedbackするよう宣言する
  gl.transformFeedbackVaryings(program, ['a_2'], gl.SEPARATE_ATTRIBS);

  // プログラムをリンク・利用する
  gl.linkProgram(program);
  gl.useProgram(program);

  // データをVBOに転送する
  const buffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_READ);

  // in変数とVBOを関連付ける
  const location = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);

  // データ保存用VBOを用意する
  const buffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STREAM_READ);

  // VBOをTRANSFORM_FEEDBACK_BUFFERにバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer2);

  // 描画命令
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, N);
  gl.endTransformFeedback();

  // 結果をCPU側に返す
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, array);

  console.log('処理結果:' + array);
};
