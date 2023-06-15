def add x y = x + y;
def sub x y = x - y;
def mul x y = x * y;
def isZero x = {def xi = fresh (1 | x); x * (1 - xi * x) = 0; 1 - xi * x};
def equal x y = isZero (x - y);
def isBool x = (x * (x - 1) = 0);
def isNegative a = {def e = 2^30; def b = a + e; def b0 = fresh (b % e); def b1 = fresh (b \ e); isBool b1; b = b0 + e * b1; 1 - b1};
def lessThan x y = isNegative (x - y);
def lessOrEqual x y = lessThan x (y + 1);
def divRem a b = {def q = fresh (a\b); def r = fresh (a%b); isNegative r = 0; lessThan r b = 1; a = b * q + r; (q, r) };
def fst (x, y) = x;
def snd (x, y) = y;
def div x y = fst (divRem x y);
def rem x y = snd (divRem x y);
def if b x y = b * x + (1 - b) * y;

def main var__0 = {

  if (equal var__0 0) 1 0
};

main (x + 0) = (out + 0);
